import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import {
  OPEN_STATUSES,
  isTaskPriority,
  isTaskStatus,
  isTaskType,
  type TaskPriority,
  type TaskStatus,
  type TaskStatusFilter,
  type TaskType,
} from "./constants";

export type TaskListItem = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledAt: string;
  estimatedMinutes: number | null;
  completedAt: string | null;
  property: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
};

export type TaskDetail = TaskListItem & {
  description: string | null;
  notes: string | null;
  startedAt: string | null;
  completedBy: string | null;
  createdAt: string;
};

const LIST_COLUMNS =
  "id, title, type, status, priority, scheduled_at, estimated_minutes, completed_at, assignee_id, property:properties (id, name)";

type TaskRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduled_at: string;
  estimated_minutes: number | null;
  completed_at: string | null;
  assignee_id: string | null;
  property: { id: string; name: string } | null;
};

/** Nomes da equipa, para mostrar o responsável sem repetir joins em cada tarefa. */
async function memberNames(businessId: string): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, profile:profiles (full_name, email)")
    .eq("business_id", businessId);
  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.user_id, row.profile?.full_name || row.profile?.email || "Membro removido"]),
  );
}

function toListItem(row: TaskRow, names: Map<string, string>): TaskListItem | null {
  if (!isTaskType(row.type) || !isTaskStatus(row.status) || !isTaskPriority(row.priority)) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    scheduledAt: row.scheduled_at,
    estimatedMinutes: row.estimated_minutes,
    completedAt: row.completed_at,
    property: row.property,
    assignee: row.assignee_id ? { id: row.assignee_id, name: names.get(row.assignee_id) ?? "Membro removido" } : null,
  };
}

export type TaskFilters = {
  businessId: string;
  search?: string;
  propertyId?: string;
  assigneeId?: string | "none";
  type?: TaskType;
  status?: TaskStatusFilter;
  priority?: TaskPriority;
  /** Intervalo de datas já convertido para UTC (início inclusivo, fim exclusivo). */
  from?: Date;
  to?: Date;
};

function tasksQuery(supabase: Awaited<ReturnType<typeof createClient>>, withCount = false) {
  return supabase.from("tasks").select(LIST_COLUMNS, withCount ? { count: "exact" } : undefined);
}
type TasksQuery = ReturnType<typeof tasksQuery>;

function applyFilters(query: TasksQuery, filters: TaskFilters, now: Date): TasksQuery {
  let q = query.eq("business_id", filters.businessId);
  if (filters.propertyId) q = q.eq("property_id", filters.propertyId);
  if (filters.assigneeId === "none") q = q.is("assignee_id", null);
  else if (filters.assigneeId) q = q.eq("assignee_id", filters.assigneeId);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.priority) q = q.eq("priority", filters.priority);
  if (filters.from) q = q.gte("scheduled_at", filters.from.toISOString());
  if (filters.to) q = q.lt("scheduled_at", filters.to.toISOString());

  switch (filters.status ?? "abertas") {
    case "abertas":
      q = q.in("status", OPEN_STATUSES);
      break;
    case "atrasadas":
      q = q.in("status", OPEN_STATUSES).lt("scheduled_at", now.toISOString());
      break;
    case "todas":
      break;
    default:
      q = q.eq("status", filters.status!);
  }

  const pattern = toIlikePattern(filters.search);
  if (pattern) q = q.ilike("title", pattern);
  return q;
}

/** Lista paginada de tarefas, por ordem da hora marcada. */
export async function listTasks(filters: TaskFilters & { page: number }, now: Date = new Date()) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);
  // Concluídas e canceladas: as mais recentes primeiro. Por fazer: as mais próximas primeiro.
  const ascending = !["completed", "cancelled", "todas"].includes(filters.status ?? "abertas");

  const query = applyFilters(tasksQuery(supabase, true), filters, now)
    .order("scheduled_at", { ascending })
    .order("id", { ascending: true })
    .range(from, to);

  const [{ data, count, error }, names] = await Promise.all([query, memberNames(filters.businessId)]);
  if (error) throw error;

  return {
    items: (data ?? []).flatMap((row) => toListItem(row as TaskRow, names) ?? []),
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Tarefas de um intervalo (vista de calendário). Limitado para proteger o browser. */
export async function listTasksInRange(filters: TaskFilters & { from: Date; to: Date }, limit = 1000) {
  const supabase = await createClient();
  const query = applyFilters(tasksQuery(supabase), { ...filters, status: filters.status ?? "todas" }, new Date())
    .order("scheduled_at", { ascending: true })
    .limit(limit + 1);

  const [{ data, error }, names] = await Promise.all([query, memberNames(filters.businessId)]);
  if (error) throw error;

  const rows = data ?? [];
  return {
    items: rows.slice(0, limit).flatMap((row) => toListItem(row as TaskRow, names) ?? []),
    truncated: rows.length > limit,
  };
}

export async function getTask(businessId: string, taskId: string): Promise<TaskDetail> {
  if (!idSchema.safeParse(taskId).success) notFound();
  const supabase = await createClient();

  const [{ data, error }, names] = await Promise.all([
    supabase
      .from("tasks")
      .select(`${LIST_COLUMNS}, description, notes, started_at, completed_by, created_at`)
      .eq("business_id", businessId)
      .eq("id", taskId)
      .maybeSingle(),
    memberNames(businessId),
  ]);

  if (error) throw error;
  if (!data) notFound();
  const item = toListItem(data as TaskRow, names);
  if (!item) notFound();

  return {
    ...item,
    description: data.description,
    notes: data.notes,
    startedAt: data.started_at,
    completedBy: data.completed_by ? (names.get(data.completed_by) ?? "Membro removido") : null,
    createdAt: data.created_at,
  };
}

/** Membros ativos que podem ser responsáveis por tarefas. */
export async function listAssigneeOptions(businessId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, profile:profiles (full_name, email)")
    .eq("business_id", businessId)
    .eq("status", "active");
  if (error) throw error;

  return (data ?? [])
    .map((row) => ({ id: row.user_id, name: row.profile?.full_name || row.profile?.email || "Sem nome" }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

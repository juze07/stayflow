import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import { isTaskPriority, type TaskPriority } from "@/modules/tasks/constants";
import {
  OPEN_ISSUE_STATUSES,
  isIssueCategory,
  isIssueStatus,
  type IssueCategory,
  type IssueStatus,
  type IssueStatusFilter,
} from "./constants";

export type IssueListItem = {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: TaskPriority;
  reportedAt: string;
  resolvedAt: string | null;
  property: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  /** Reportado pelo inquilino no portal. */
  fromTenant: boolean;
};

export type IssueDetail = IssueListItem & {
  description: string | null;
  reportedBy: string | null;
  reportedById: string | null;
  estimatedCostCents: number | null;
  finalCostCents: number | null;
  sourceInspection: { id: string; taskId: string; taskTitle: string } | null;
  /** Estadia de origem (só visível para administradores e gestores). */
  stay: { id: string; guestName: string } | null;
};

const LIST_COLUMNS =
  "id, title, category, status, priority, reported_at, resolved_at, assignee_id, stay_id, property:properties (id, name)";

type IssueRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  reported_at: string;
  resolved_at: string | null;
  assignee_id: string | null;
  stay_id: string | null;
  property: { id: string; name: string } | null;
};

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

function toListItem(row: IssueRow, names: Map<string, string>): IssueListItem | null {
  if (!isIssueCategory(row.category) || !isIssueStatus(row.status) || !isTaskPriority(row.priority)) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    priority: row.priority,
    reportedAt: row.reported_at,
    resolvedAt: row.resolved_at,
    property: row.property,
    assignee: row.assignee_id ? { id: row.assignee_id, name: names.get(row.assignee_id) ?? "Membro removido" } : null,
    fromTenant: row.stay_id !== null,
  };
}

export type IssueFilters = {
  businessId: string;
  search?: string;
  propertyId?: string;
  assigneeId?: string;
  category?: IssueCategory;
  priority?: TaskPriority;
  status?: IssueStatusFilter;
  page: number;
};

export async function listIssues(filters: IssueFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);
  const status = filters.status ?? "abertos";

  let query = supabase
    .from("maintenance_issues")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("business_id", filters.businessId)
    .order("reported_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (status === "abertos") query = query.in("status", OPEN_ISSUE_STATUSES);
  else if (status !== "todos") query = query.eq("status", status);
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.priority) query = query.eq("priority", filters.priority);
  const pattern = toIlikePattern(filters.search);
  if (pattern) query = query.ilike("title", pattern);

  const [{ data, count, error }, names] = await Promise.all([query, memberNames(filters.businessId)]);
  if (error) throw error;
  return {
    items: (data ?? []).flatMap((row) => toListItem(row, names) ?? []),
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Problemas de uma propriedade (página da propriedade). */
export async function listPropertyIssues(businessId: string, propertyId: string, limit = 10) {
  const supabase = await createClient();
  const [{ data, error }, names] = await Promise.all([
    supabase
      .from("maintenance_issues")
      .select(LIST_COLUMNS)
      .eq("business_id", businessId)
      .eq("property_id", propertyId)
      .order("reported_at", { ascending: false })
      .limit(limit),
    memberNames(businessId),
  ]);
  if (error) throw error;
  return (data ?? []).flatMap((row) => toListItem(row, names) ?? []);
}

export async function getIssue(businessId: string, issueId: string): Promise<IssueDetail> {
  if (!idSchema.safeParse(issueId).success) notFound();
  const supabase = await createClient();
  const [{ data, error }, names] = await Promise.all([
    supabase
      .from("maintenance_issues")
      .select(
        `${LIST_COLUMNS}, description, reported_by, estimated_cost_cents, final_cost_cents,
         inspection:inspections (id, task:tasks (id, title)), stay:stays (id, guest_name)`,
      )
      .eq("business_id", businessId)
      .eq("id", issueId)
      .maybeSingle(),
    memberNames(businessId),
  ]);
  if (error) throw error;
  if (!data) notFound();
  const item = toListItem(data, names);
  if (!item) notFound();

  return {
    ...item,
    description: data.description,
    reportedBy: data.reported_by
      ? (names.get(data.reported_by) ??
        (data.stay_id ? `${data.stay?.guest_name ?? "inquilino"} (inquilino)` : "Membro removido"))
      : null,
    reportedById: data.reported_by,
    estimatedCostCents: data.estimated_cost_cents,
    finalCostCents: data.final_cost_cents,
    sourceInspection: data.inspection?.task
      ? { id: data.inspection.id, taskId: data.inspection.task.id, taskTitle: data.inspection.task.title }
      : null,
    stay: data.stay ? { id: data.stay.id, guestName: data.stay.guest_name } : null,
  };
}

/** Problemas reportados numa estadia (página da estadia). */
export async function listStayIssues(businessId: string, stayId: string) {
  const supabase = await createClient();
  const [{ data, error }, names] = await Promise.all([
    supabase
      .from("maintenance_issues")
      .select(LIST_COLUMNS)
      .eq("business_id", businessId)
      .eq("stay_id", stayId)
      .order("reported_at", { ascending: false })
      .limit(50),
    memberNames(businessId),
  ]);
  if (error) throw error;
  return (data ?? []).flatMap((row) => toListItem(row, names) ?? []);
}

/** Dados mínimos de um problema, para pré-preencher uma tarefa de reparação. Ignora ids inválidos. */
export async function getMaintenanceIssueOption(businessId: string, issueId: string | undefined) {
  if (!issueId || !idSchema.safeParse(issueId).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .select("id, title, priority, property_id")
    .eq("business_id", businessId)
    .eq("id", issueId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isTaskPriority(data.priority)) return null;
  return { id: data.id, title: data.title, priority: data.priority, propertyId: data.property_id };
}

/** Inspeção de origem (ao reportar a partir de uma inspeção). Ignora ids inválidos. */
export async function getInspectionSource(businessId: string, taskId: string | undefined) {
  if (!taskId || !idSchema.safeParse(taskId).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inspections")
    .select("id, observations, task:tasks (id, title, property_id)")
    .eq("business_id", businessId)
    .eq("task_id", taskId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.task) return null;
  return {
    inspectionId: data.id,
    taskId: data.task.id,
    taskTitle: data.task.title,
    propertyId: data.task.property_id,
    observations: data.observations,
  };
}

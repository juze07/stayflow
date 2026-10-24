import "server-only";
import { dayRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { OPEN_STATUSES } from "@/modules/tasks/constants";
import { listTasks } from "@/modules/tasks/queries";

export type DashboardOverview = {
  activeProperties: number;
  tasksToday: number;
  overdueTasks: number;
  openIssues: number;
  teamSize: number;
  pendingInvitations: number;
  hasBusinessDetails: boolean;
};

/**
 * Indicadores calculados a partir da base de dados (nunca valores inventados).
 * O RLS garante que só são contadas linhas da empresa do utilizador; o filtro
 * por business_id escolhe a empresa ativa quando há mais do que uma.
 */
export async function getDashboardOverview(
  businessId: string,
  timeZone: string,
  now: Date,
): Promise<DashboardOverview> {
  const supabase = await createClient();
  const today = dayRange(now, timeZone);

  const [properties, tasks, overdue, issues, members, invitations, business] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .is("archived_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .gte("scheduled_at", today.start.toISOString())
      .lt("scheduled_at", today.end.toISOString()),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", OPEN_STATUSES)
      .lt("scheduled_at", now.toISOString()),
    supabase
      .from("maintenance_issues")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["open", "investigating", "in_progress"]),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "active"),
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .is("accepted_at", null)
      .is("revoked_at", null),
    supabase.from("businesses").select("address_line, city").eq("id", businessId).single(),
  ]);

  const firstError = [properties, tasks, overdue, issues, members, invitations, business].find((r) => r.error);
  if (firstError?.error) throw firstError.error;

  return {
    activeProperties: properties.count ?? 0,
    tasksToday: tasks.count ?? 0,
    overdueTasks: overdue.count ?? 0,
    openIssues: issues.count ?? 0,
    teamSize: members.count ?? 0,
    pendingInvitations: invitations.count ?? 0,
    hasBusinessDetails: Boolean(business.data?.address_line && business.data?.city),
  };
}

export type TaskSeriesPoint = { day: string; scheduled: number; completed: number };

/** Tarefas agendadas e concluídas por dia (função SQL com RLS). */
export async function getTaskSeries(businessId: string, from: string, to: string, timeZone: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_task_series", {
    p_business_id: businessId,
    p_from: from,
    p_to: to,
    p_timezone: timeZone,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, scheduled: row.scheduled, completed: row.completed }));
}

/** Despesas por dia, em cêntimos. Para colaboradores o RLS devolve zeros. */
export async function getExpenseSeries(businessId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_expense_series", {
    p_business_id: businessId,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, amountCents: Number(row.amount_cents) }));
}

/** Tarefas que pedem atenção: atrasadas ou urgentes, ainda por fazer. */
export async function listAttentionTasks(businessId: string, now: Date, limit = 6) {
  const [overdue, urgent] = await Promise.all([
    listTasks({ businessId, status: "atrasadas", page: 1 }, now),
    listTasks({ businessId, status: "abertas", priority: "urgent", page: 1 }, now),
  ]);
  const seen = new Set<string>();
  const merged = [...overdue.items, ...urgent.items].filter((task) => !seen.has(task.id) && seen.add(task.id));
  merged.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return merged.slice(0, limit);
}

/** Tarefas marcadas para hoje (todas, ou só as de uma pessoa). */
export async function listTodayTasks(businessId: string, timeZone: string, now: Date, assigneeId?: string) {
  const today = dayRange(now, timeZone);
  const { items, total } = await listTasks(
    { businessId, status: "todas", assigneeId, from: today.start, to: today.end, page: 1 },
    now,
  );
  // "todas" ordena das mais recentes para as mais antigas; para o dia de hoje, a ordem natural é a da hora.
  return { items: [...items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)), total };
}

export async function listRecentlyCompleted(businessId: string, now: Date, limit = 5) {
  const { items } = await listTasks({ businessId, status: "completed", page: 1 }, now);
  return [...items].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, limit);
}

export type ActivityItem = {
  id: number;
  createdAt: string;
  actorName: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
};

export async function listRecentActivity(businessId: string, limit = 8): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, created_at, entity_type, entity_id, action, summary, metadata, actor:profiles (full_name, email)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    actorName: row.actor?.full_name || row.actor?.email || null,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}

/** Total de despesas num intervalo de datas civis. */
export function sumExpenses(series: { amountCents: number }[]): number {
  return series.reduce((total, point) => total + point.amountCents, 0);
}

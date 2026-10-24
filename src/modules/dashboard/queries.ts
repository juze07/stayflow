import "server-only";
import { dayRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export type DashboardOverview = {
  activeProperties: number;
  tasksToday: number;
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
export async function getDashboardOverview(businessId: string, timeZone: string): Promise<DashboardOverview> {
  const supabase = await createClient();
  const today = dayRange(new Date(), timeZone);

  const [properties, tasks, issues, members, invitations, business] = await Promise.all([
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

  const firstError = [properties, tasks, issues, members, invitations, business].find((result) => result.error);
  if (firstError?.error) throw firstError.error;

  return {
    activeProperties: properties.count ?? 0,
    tasksToday: tasks.count ?? 0,
    openIssues: issues.count ?? 0,
    teamSize: members.count ?? 0,
    pendingInvitations: invitations.count ?? 0,
    hasBusinessDetails: Boolean(business.data?.address_line && business.data?.city),
  };
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_BUSINESS_COOKIE,
  resolveActiveMembership,
  type BusinessSummary,
  type MembershipSummary,
} from "./active-business";
import { isRole, type Role } from "./roles";

export type SessionContext = {
  user: { id: string; email: string };
  profile: { fullName: string; phone: string | null };
  memberships: MembershipSummary[];
  active: MembershipSummary | null;
};

export type BusinessContext = SessionContext & {
  active: MembershipSummary;
  business: BusinessSummary;
  role: Role;
};

/**
 * Lê a sessão e as empresas do utilizador. `cache` garante uma única ida à
 * base de dados por pedido, mesmo que vários componentes a chamem.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const [profileResult, membershipsResult, cookieStore] = await Promise.all([
    supabase.from("profiles").select("email, full_name, phone, last_business_id").eq("id", userId).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, business:businesses (id, name, timezone, locale, currency)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    cookies(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const memberships: MembershipSummary[] = (membershipsResult.data ?? []).flatMap((row) =>
    row.business && isRole(row.role) ? [{ role: row.role, business: row.business }] : [],
  );

  const profile = profileResult.data;
  const active = resolveActiveMembership(
    memberships,
    cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value,
    profile?.last_business_id,
  );

  return {
    user: { id: userId, email: profile?.email ?? String(claimsData.claims.email ?? "") },
    profile: { fullName: profile?.full_name ?? "", phone: profile?.phone ?? null },
    memberships,
    active,
  };
});

/** Exige sessão iniciada; caso contrário envia para o login. */
export async function requireSession(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) redirect("/entrar");
  return context;
}

/** Exige sessão e uma empresa ativa; sem empresa, envia para o onboarding. */
export async function requireBusiness(): Promise<BusinessContext> {
  const context = await requireSession();
  if (!context.active) redirect("/onboarding");
  return { ...context, active: context.active, business: context.active.business, role: context.active.role };
}

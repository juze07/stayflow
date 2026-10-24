import type { Role } from "./roles";

export const ACTIVE_BUSINESS_COOKIE = "sf_business";

export type BusinessSummary = {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  currency: string;
};

export type MembershipSummary = {
  role: Role;
  business: BusinessSummary;
};

/**
 * Escolhe a empresa ativa: a do cookie, se o utilizador ainda for membro;
 * senão a última usada; senão a primeira. O cookie é só uma preferência:
 * nunca dá acesso a uma empresa de que o utilizador não seja membro.
 */
export function resolveActiveMembership(
  memberships: MembershipSummary[],
  preferredBusinessId?: string | null,
  lastBusinessId?: string | null,
): MembershipSummary | null {
  if (memberships.length === 0) return null;

  for (const candidate of [preferredBusinessId, lastBusinessId]) {
    if (!candidate) continue;
    const match = memberships.find((membership) => membership.business.id === candidate);
    if (match) return match;
  }

  return memberships[0];
}

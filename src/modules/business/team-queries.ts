import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isRole, type Role } from "./roles";

export type TeamMember = {
  membershipId: string;
  userId: string;
  role: Role;
  status: string;
  fullName: string;
  email: string;
  joinedAt: string;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  expired: boolean;
  createdAt: string;
};

export async function listTeamMembers(businessId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, status, created_at, profile:profiles (full_name, email)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    isRole(row.role)
      ? [
          {
            membershipId: row.id,
            userId: row.user_id,
            role: row.role,
            status: row.status,
            fullName: row.profile?.full_name ?? "",
            email: row.profile?.email ?? "",
            joinedAt: row.created_at,
          },
        ]
      : [],
  );
}

/**
 * Convites por aceitar. O RLS só devolve resultados a administradores e
 * gestores; para colaboradores a lista vem vazia.
 */
export async function listPendingInvitations(businessId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, token, expires_at, created_at")
    .eq("business_id", businessId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = Date.now();
  return (data ?? []).flatMap((row) =>
    isRole(row.role)
      ? [
          {
            id: row.id,
            email: row.email,
            role: row.role,
            token: row.token,
            expiresAt: row.expires_at,
            expired: new Date(row.expires_at).getTime() < now,
            createdAt: row.created_at,
          },
        ]
      : [],
  );
}

export async function getBusinessSettings(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, tax_id, email, phone, address_line, postal_code, city, timezone")
    .eq("id", businessId)
    .single();

  if (error) throw error;
  return data;
}

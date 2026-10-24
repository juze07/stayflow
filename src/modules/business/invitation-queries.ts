import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isRole, type Role } from "./roles";

export type InvitationPreview = {
  businessName: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "expired" | "revoked";
};

const STATUSES = ["pending", "accepted", "expired", "revoked"] as const;

export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation", { p_token: token });
  if (error) throw error;

  const row = data?.[0];
  if (!row || !isRole(row.role)) return null;
  const status = STATUSES.find((value) => value === row.status) ?? "expired";

  return { businessName: row.business_name, email: row.email, role: row.role, status };
}

export async function getMyPendingInvitations() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_pending_invitations");
  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    isRole(row.role) ? [{ token: row.token, businessName: row.business_name, role: row.role }] : [],
  );
}

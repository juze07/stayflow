import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isIssueCategory, isIssueStatus, type IssueCategory, type IssueStatus } from "@/modules/maintenance/constants";
import { isPaymentStatus, type PaymentStatus } from "@/modules/payments/constants";

export type TenantStay = {
  id: string;
  businessName: string;
  businessEmail: string | null;
  businessPhone: string | null;
  businessTimezone: string;
  paymentInstructions: string | null;
  propertyName: string;
  address: string;
  /** Só durante a estadia (a partir da véspera); senão null. */
  accessInstructions: string | null;
  guestName: string;
  startsOn: string;
  endsOn: string | null;
};

export type TenantPayment = {
  id: string;
  stayId: string;
  description: string;
  amountCents: number;
  dueOn: string;
  status: PaymentStatus;
  paidOn: string | null;
  reportedAt: string | null;
  reference: string | null;
};

export type TenantIssue = {
  id: string;
  stayId: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  reportedAt: string;
};

/** Estadias da conta autenticada (RPC: o inquilino não lê as tabelas da empresa). */
export async function getMyStays(): Promise<TenantStay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_stays");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.stay_id,
    businessName: row.business_name,
    businessEmail: row.business_email,
    businessPhone: row.business_phone,
    businessTimezone: row.business_timezone,
    paymentInstructions: row.payment_instructions,
    propertyName: row.property_name,
    address: `${row.address_line}, ${row.postal_code} ${row.city}`,
    accessInstructions: row.access_instructions,
    guestName: row.guest_name,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
  }));
}

export async function getMyPayments(): Promise<TenantPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_stay_payments");
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    isPaymentStatus(row.status)
      ? [
          {
            id: row.payment_id,
            stayId: row.stay_id,
            description: row.description,
            amountCents: row.amount_cents,
            dueOn: row.due_on,
            status: row.status,
            paidOn: row.paid_on,
            reportedAt: row.tenant_reported_at,
            reference: row.tenant_reference,
          },
        ]
      : [],
  );
}

export async function getMyIssues(): Promise<TenantIssue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_stay_issues");
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    isIssueCategory(row.category) && isIssueStatus(row.status)
      ? [
          {
            id: row.issue_id,
            stayId: row.stay_id,
            title: row.title,
            category: row.category,
            status: row.status,
            reportedAt: row.reported_at,
          },
        ]
      : [],
  );
}

export async function getStayInvitationPreview(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_stay_invitation", { p_token: token });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    businessName: row.business_name,
    propertyName: row.property_name,
    email: row.guest_email,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    status: row.status as "pending" | "accepted" | "cancelled",
  };
}

export async function getMyPendingStayInvitations() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_pending_stay_invitations");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    token: row.token,
    businessName: row.business_name,
    propertyName: row.property_name,
    startsOn: row.starts_on,
  }));
}

/** Tem pelo menos uma estadia ligada à conta (para encaminhar para o portal). */
export async function hasTenantStays(): Promise<boolean> {
  return (await getMyStays()).length > 0;
}

import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import type { StayFilter } from "./constants";

export type StayListItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  startsOn: string;
  endsOn: string | null;
  cancelledAt: string | null;
  linked: boolean;
  property: { id: string; name: string } | null;
};

export type StayDetail = StayListItem & {
  guestPhone: string | null;
  notes: string | null;
  inviteToken: string;
  inviteAcceptedAt: string | null;
  tenantName: string | null;
};

const LIST_COLUMNS =
  "id, guest_name, guest_email, starts_on, ends_on, cancelled_at, tenant_user_id, property:properties (id, name)";

type StayRow = {
  id: string;
  guest_name: string;
  guest_email: string;
  starts_on: string;
  ends_on: string | null;
  cancelled_at: string | null;
  tenant_user_id: string | null;
  property: { id: string; name: string } | null;
};

function toListItem(row: StayRow): StayListItem {
  return {
    id: row.id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    cancelledAt: row.cancelled_at,
    linked: row.tenant_user_id !== null,
    property: row.property,
  };
}

export type StayFilters = {
  businessId: string;
  today: string;
  search?: string;
  propertyId?: string;
  status: StayFilter;
  page: number;
};

/** O RLS só devolve estadias a administradores e gestores. */
export async function listStays(filters: StayFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("stays")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("business_id", filters.businessId)
    .range(from, to);

  if (filters.status === "ativas") {
    query = query
      .is("cancelled_at", null)
      .or(`ends_on.is.null,ends_on.gte.${filters.today}`)
      .order("starts_on", { ascending: true });
  } else if (filters.status === "terminadas") {
    query = query.is("cancelled_at", null).lt("ends_on", filters.today).order("starts_on", { ascending: false });
  } else if (filters.status === "canceladas") {
    query = query.not("cancelled_at", "is", null).order("starts_on", { ascending: false });
  } else {
    query = query.order("starts_on", { ascending: false });
  }
  query = query.order("id", { ascending: true });
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  const pattern = toIlikePattern(filters.search);
  if (pattern) query = query.or(`guest_name.ilike.${pattern},guest_email.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) throw error;
  return { items: (data ?? []).map(toListItem), total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function getStay(businessId: string, stayId: string): Promise<StayDetail> {
  if (!idSchema.safeParse(stayId).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .select(
      `${LIST_COLUMNS}, guest_phone, notes, invite_token, invite_accepted_at,
       tenant:profiles!stays_tenant_user_id_fkey (full_name, email)`,
    )
    .eq("business_id", businessId)
    .eq("id", stayId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return {
    ...toListItem(data),
    guestPhone: data.guest_phone,
    notes: data.notes,
    inviteToken: data.invite_token,
    inviteAcceptedAt: data.invite_accepted_at,
    tenantName: data.tenant ? data.tenant.full_name || data.tenant.email : null,
  };
}

/** Estadias (não canceladas) para ligar a um pagamento, das mais recentes para as mais antigas. */
export async function listStayOptions(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .select("id, guest_name, starts_on, property_id")
    .eq("business_id", businessId)
    .is("cancelled_at", null)
    .order("starts_on", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.guest_name,
    startsOn: row.starts_on,
    propertyId: row.property_id,
  }));
}

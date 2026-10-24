import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import type { ReportRange } from "@/modules/expenses/report";
import {
  isPaymentMethod,
  isPaymentStatus,
  type PaymentFilter,
  type PaymentMethod,
  type PaymentStatus,
} from "./constants";
import type { RevenueRow } from "./report";

export type PaymentListItem = {
  id: string;
  description: string;
  amountCents: number;
  dueOn: string;
  status: PaymentStatus;
  paidOn: string | null;
  method: PaymentMethod | null;
  tenantReportedAt: string | null;
  tenantReference: string | null;
  property: { id: string; name: string } | null;
  stay: { id: string; guestName: string } | null;
};

export type PaymentDetail = PaymentListItem & { notes: string | null };

const LIST_COLUMNS = `id, description, amount_cents, due_on, status, paid_on, method, tenant_reported_at,
  tenant_reference, property:properties (id, name), stay:stays (id, guest_name)`;

type PaymentRow = {
  id: string;
  description: string;
  amount_cents: number;
  due_on: string;
  status: string;
  paid_on: string | null;
  method: string | null;
  tenant_reported_at: string | null;
  tenant_reference: string | null;
  property: { id: string; name: string } | null;
  stay: { id: string; guest_name: string } | null;
};

function toListItem(row: PaymentRow): PaymentListItem | null {
  if (!isPaymentStatus(row.status)) return null;
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    dueOn: row.due_on,
    status: row.status,
    paidOn: row.paid_on,
    method: row.method && isPaymentMethod(row.method) ? row.method : null,
    tenantReportedAt: row.tenant_reported_at,
    tenantReference: row.tenant_reference,
    property: row.property,
    stay: row.stay ? { id: row.stay.id, guestName: row.stay.guest_name } : null,
  };
}

export type PaymentFilters = {
  businessId: string;
  today: string;
  search?: string;
  propertyId?: string;
  status: PaymentFilter;
  page: number;
};

/** O RLS só devolve pagamentos a administradores e gestores. */
export async function listPayments(filters: PaymentFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("payments")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("business_id", filters.businessId)
    .range(from, to);

  switch (filters.status) {
    case "por-receber":
      query = query.eq("status", "pending").order("due_on", { ascending: true });
      break;
    case "em-atraso":
      query = query.eq("status", "pending").lt("due_on", filters.today).order("due_on", { ascending: true });
      break;
    case "recebidos":
      query = query.eq("status", "paid").order("paid_on", { ascending: false });
      break;
    case "cancelados":
      query = query.eq("status", "cancelled").order("due_on", { ascending: false });
      break;
    case "todos":
      query = query.order("due_on", { ascending: false });
  }
  query = query.order("id", { ascending: true });
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  const pattern = toIlikePattern(filters.search);
  if (pattern) query = query.ilike("description", pattern);

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    items: (data ?? []).flatMap((row) => toListItem(row) ?? []),
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Pagamentos de uma estadia (página da estadia). */
export async function listStayPayments(businessId: string, stayId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(LIST_COLUMNS)
    .eq("business_id", businessId)
    .eq("stay_id", stayId)
    .order("due_on", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []).flatMap((row) => toListItem(row) ?? []);
}

export async function getPayment(businessId: string, paymentId: string): Promise<PaymentDetail> {
  if (!idSchema.safeParse(paymentId).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`${LIST_COLUMNS}, notes`)
    .eq("business_id", businessId)
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const item = toListItem(data);
  if (!item) notFound();
  return { ...item, notes: data.notes };
}

/** Totais por receber (independentes do período): todos e os já vencidos. */
export async function getOutstanding(businessId: string, today: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents, due_on, tenant_reported_at")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .limit(5000);
  if (error) throw error;
  const rows = data ?? [];
  const overdue = rows.filter((row) => row.due_on < today);
  return {
    totalCents: rows.reduce((sum, row) => sum + row.amount_cents, 0),
    count: rows.length,
    overdueCents: overdue.reduce((sum, row) => sum + row.amount_cents, 0),
    overdueCount: overdue.length,
    reportedCount: rows.filter((row) => row.tenant_reported_at !== null).length,
  };
}

/** Linhas agregadas do relatório de resultados (mês × propriedade). */
export async function getRevenueReportRows(businessId: string, range: ReportRange): Promise<RevenueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("revenue_report", {
    p_business_id: businessId,
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    month: row.month,
    propertyId: row.property_id,
    revenueCents: Number(row.revenue_cents),
    expenseCents: Number(row.expense_cents),
  }));
}

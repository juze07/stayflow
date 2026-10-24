import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import { isExpenseCategory, type ExpenseCategory } from "./constants";
import type { ReportRange, ReportRow } from "./report";

export type ExpenseListItem = {
  id: string;
  description: string;
  category: ExpenseCategory;
  amountCents: number;
  incurredOn: string;
  supplier: string | null;
  property: { id: string; name: string } | null;
  receiptCount: number;
};

export type ExpenseDetail = ExpenseListItem & {
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
  maintenanceIssue: { id: string; title: string } | null;
};

const LIST_COLUMNS =
  "id, description, category, amount_cents, incurred_on, supplier, property:properties (id, name), attachments (count)";

type ExpenseRow = {
  id: string;
  description: string;
  category: string;
  amount_cents: number;
  incurred_on: string;
  supplier: string | null;
  property: { id: string; name: string } | null;
  attachments: { count: number }[];
};

function toListItem(row: ExpenseRow): ExpenseListItem | null {
  if (!isExpenseCategory(row.category)) return null;
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    amountCents: row.amount_cents,
    incurredOn: row.incurred_on,
    supplier: row.supplier,
    property: row.property,
    receiptCount: row.attachments[0]?.count ?? 0,
  };
}

export type ExpenseFilters = {
  businessId: string;
  search?: string;
  /** Id da propriedade, ou "geral" para despesas sem propriedade. */
  propertyId?: string;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  page: number;
};

/** O RLS só devolve despesas a administradores e gestores. */
export async function listExpenses(filters: ExpenseFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("expenses")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("business_id", filters.businessId)
    .order("incurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.propertyId === "geral") query = query.is("property_id", null);
  else if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.from) query = query.gte("incurred_on", filters.from);
  if (filters.to) query = query.lte("incurred_on", filters.to);
  const pattern = toIlikePattern(filters.search);
  if (pattern) query = query.or(`description.ilike.${pattern},supplier.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    items: (data ?? []).flatMap((row) => toListItem(row) ?? []),
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Despesas ligadas a um problema de manutenção. */
export async function listIssueExpenses(businessId: string, issueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(LIST_COLUMNS)
    .eq("business_id", businessId)
    .eq("maintenance_issue_id", issueId)
    .order("incurred_on", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).flatMap((row) => toListItem(row) ?? []);
}

export async function getExpense(businessId: string, expenseId: string): Promise<ExpenseDetail> {
  if (!idSchema.safeParse(expenseId).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `${LIST_COLUMNS}, notes, created_at, created_by,
       issue:maintenance_issues (id, title), author:profiles (full_name, email)`,
    )
    .eq("business_id", businessId)
    .eq("id", expenseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const item = toListItem(data);
  if (!item) notFound();

  return {
    ...item,
    notes: data.notes,
    createdAt: data.created_at,
    createdBy: data.author ? data.author.full_name || data.author.email : null,
    maintenanceIssue: data.issue,
  };
}

/** Linhas agregadas do relatório (mês × propriedade × categoria). */
export async function getExpenseReportRows(businessId: string, range: ReportRange): Promise<ReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("expense_report", {
    p_business_id: businessId,
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    isExpenseCategory(row.category)
      ? [
          {
            month: row.month,
            propertyId: row.property_id,
            category: row.category,
            totalCents: Number(row.total_cents),
            count: row.expense_count,
          },
        ]
      : [],
  );
}

/** Problemas de manutenção para ligar a uma despesa (os mais recentes primeiro). */
export async function listIssueOptions(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .select("id, title, property_id")
    .eq("business_id", businessId)
    .order("reported_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.title, propertyId: row.property_id }));
}

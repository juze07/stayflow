"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { attachmentPaths, removeStoredFiles } from "@/modules/attachments/files";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { expenseSchema, type ExpenseInput, type ExpenseValues } from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem gerir despesas.";
const NOT_FOUND = "Despesa não encontrada ou sem permissão para a alterar.";

function expenseErrorMessage(
  error: { code?: string; message?: string } | null,
): { message: string; field?: "maintenanceIssueId" } | null {
  const text = error?.message ?? "";
  if (text.includes("expense_property_mismatch")) {
    return {
      message: "O problema de manutenção escolhido é de outra propriedade.",
      field: "maintenanceIssueId",
    };
  }
  if (error?.code === "23503") return { message: "A propriedade ou o problema escolhido já não existe." };
  if (error?.code === "42501") return { message: NO_PERMISSION };
  return null;
}

function handleWriteError(error: { code?: string; message?: string }, context: string) {
  const known = expenseErrorMessage(error);
  if (known) return failure(known.message, known.field ? { [known.field]: [known.message] } : undefined);
  console.error(context, error);
  return failure(GENERIC_ERROR);
}

function toRow(values: ExpenseValues) {
  return {
    description: values.description,
    category: values.category,
    amount_cents: values.amount,
    incurred_on: values.incurredOn,
    property_id: values.propertyId,
    maintenance_issue_id: values.maintenanceIssueId,
    supplier: values.supplier,
    notes: values.notes,
  };
}

function revalidateExpenseViews(row: { id?: string; property_id: string | null; maintenance_issue_id: string | null }) {
  revalidatePath("/despesas", "layout");
  revalidatePath("/dashboard");
  if (row.property_id) revalidatePath(`/propriedades/${row.property_id}`);
  if (row.maintenance_issue_id) revalidatePath(`/manutencao/${row.maintenance_issue_id}`);
}

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const parsed = parseInput(expenseSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ business_id: business.id, ...toRow(parsed.data) })
    .select("id, property_id, maintenance_issue_id")
    .single();

  if (error || !data) return handleWriteError(error ?? {}, "create expense failed");

  revalidateExpenseViews(data);
  // Na página da despesa pode anexar logo o comprovativo.
  redirect(`/despesas/${data.id}`);
}

export async function updateExpenseAction(expenseId: string, input: ExpenseInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(expenseId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(expenseSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(toRow(parsed.data))
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id, property_id, maintenance_issue_id");

  if (error) return handleWriteError(error, "update expense failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateExpenseViews(data[0]);
  redirect(`/despesas/${id.data}`);
}

export async function deleteExpenseAction(expenseId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(expenseId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const paths = await attachmentPaths(supabase, business.id, "expense_id", [id.data]);
  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id, property_id, maintenance_issue_id");

  if (error) {
    console.error("delete expense failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure(NOT_FOUND);

  await removeStoredFiles(supabase, paths);
  revalidateExpenseViews(data[0]);
  redirect("/despesas");
}

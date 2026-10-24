"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { markPaidSchema, paymentSchema, type MarkPaidInput, type PaymentInput, type PaymentValues } from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem gerir receitas.";
const NOT_FOUND = "Pagamento não encontrado ou sem permissão para o alterar.";

function handleWriteError(error: { code?: string; message?: string }, context: string) {
  if (error.message?.includes("payment_property_mismatch")) {
    const message = "A estadia escolhida é de outra propriedade.";
    return failure(message, { stayId: [message] });
  }
  if (error.code === "23503") return failure("A propriedade ou a estadia escolhida já não existe.");
  if (error.code === "42501") return failure(NO_PERMISSION);
  console.error(context, error);
  return failure(GENERIC_ERROR);
}

function toRow(values: PaymentValues) {
  return {
    description: values.description,
    amount_cents: values.amount,
    due_on: values.dueOn,
    property_id: values.propertyId,
    stay_id: values.stayId,
    status: values.paid ? ("paid" as const) : ("pending" as const),
    paid_on: values.paid ? values.paidOn : null,
    method: values.method,
    notes: values.notes,
  };
}

function revalidatePaymentViews(stayId: string | null) {
  revalidatePath("/receitas", "layout");
  if (stayId) revalidatePath(`/estadias/${stayId}`);
}

export async function createPaymentAction(input: PaymentInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const parsed = parseInput(paymentSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({ business_id: business.id, ...toRow(parsed.data) });
  if (error) return handleWriteError(error, "create payment failed");

  revalidatePaymentViews(parsed.data.stayId);
  redirect(parsed.data.stayId ? `/estadias/${parsed.data.stayId}` : "/receitas/pagamentos");
}

export async function updatePaymentAction(paymentId: string, input: PaymentInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(paymentSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update(toRow(parsed.data))
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");
  if (error) return handleWriteError(error, "update payment failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePaymentViews(parsed.data.stayId);
  redirect(parsed.data.stayId ? `/estadias/${parsed.data.stayId}` : "/receitas/pagamentos");
}

/** Confirma o recebimento (data e método). */
export async function markPaymentPaidAction(paymentId: string, input: MarkPaidInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(markPaidSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_on: parsed.data.paidOn, method: parsed.data.method })
    .eq("business_id", business.id)
    .eq("id", id.data)
    .eq("status", "pending")
    .select("stay_id");
  if (error) return handleWriteError(error, "mark payment paid failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePaymentViews(data[0].stay_id);
  return success(undefined, "Pagamento marcado como recebido.");
}

/** Volta a "por receber" ou cancela (o pagamento cancelado não conta como receita). */
export async function setPaymentStatusAction(
  paymentId: string,
  status: "pending" | "cancelled",
): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(paymentId);
  if (!id.success || (status !== "pending" && status !== "cancelled")) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ status, paid_on: null })
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("stay_id");
  if (error) return handleWriteError(error, "update payment status failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePaymentViews(data[0].stay_id);
  return success(undefined, status === "cancelled" ? "Pagamento cancelado." : "Pagamento por receber.");
}

export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("stay_id");
  if (error) return handleWriteError(error, "delete payment failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePaymentViews(data[0].stay_id);
  redirect(data[0].stay_id ? `/estadias/${data[0].stay_id}` : "/receitas/pagamentos");
}

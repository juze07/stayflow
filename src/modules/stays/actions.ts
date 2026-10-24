"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { staySchema, type StayInput, type StayValues } from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem gerir estadias.";
const NOT_FOUND = "Estadia não encontrada ou sem permissão para a alterar.";

function handleWriteError(error: { code?: string; message?: string }, context: string) {
  if (error.code === "23503") return failure("A propriedade escolhida já não existe.");
  if (error.code === "42501") return failure(NO_PERMISSION);
  console.error(context, error);
  return failure(GENERIC_ERROR);
}

function toRow(values: StayValues) {
  return {
    property_id: values.propertyId,
    guest_name: values.guestName,
    guest_email: values.guestEmail,
    guest_phone: values.guestPhone,
    starts_on: values.startsOn,
    ends_on: values.endsOn,
    notes: values.notes,
  };
}

function revalidateStayViews(id: string) {
  revalidatePath("/estadias", "layout");
  revalidatePath(`/estadias/${id}`);
}

export async function createStayAction(input: StayInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const parsed = parseInput(staySchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .insert({ business_id: business.id, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error || !data) return handleWriteError(error ?? {}, "create stay failed");

  revalidateStayViews(data.id);
  // Na página da estadia está o link de acesso para enviar ao inquilino.
  redirect(`/estadias/${data.id}`);
}

export async function updateStayAction(stayId: string, input: StayInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(stayId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(staySchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .update(toRow(parsed.data))
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");
  if (error) return handleWriteError(error, "update stay failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateStayViews(id.data);
  redirect(`/estadias/${id.data}`);
}

async function updateStay(stayId: string, patch: { cancelled_at?: string | null; tenant_user_id?: null }) {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(stayId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .update(patch.tenant_user_id === null ? { ...patch, invite_token: crypto.randomUUID() } : patch)
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");
  if (error) return handleWriteError(error, "update stay failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateStayViews(id.data);
  return { ok: true as const, id: id.data };
}

/** Cancela (ou reativa) a estadia. O inquilino deixa de a ver enquanto estiver cancelada. */
export async function setStayCancelledAction(stayId: string, cancelled: boolean): Promise<ActionResult> {
  const result = await updateStay(stayId, { cancelled_at: cancelled ? new Date().toISOString() : null });
  if (!result.ok) return result;
  return success(undefined, cancelled ? "Estadia cancelada." : "Estadia reativada.");
}

/** Retira o acesso da conta ligada e gera um link novo (o anterior deixa de funcionar). */
export async function resetStayAccessAction(stayId: string): Promise<ActionResult> {
  const result = await updateStay(stayId, { tenant_user_id: null });
  if (!result.ok) return result;
  return success(undefined, "Acesso retirado. Envie o novo link ao inquilino.");
}

export async function deleteStayAction(stayId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(stayId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");
  if (error) return handleWriteError(error, "delete stay failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePath("/estadias", "layout");
  revalidatePath("/receitas", "layout");
  redirect("/estadias");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { propertySchema, type PropertyInput, type PropertyValues } from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem gerir propriedades.";

function toRow(values: PropertyValues) {
  return {
    name: values.name,
    address_line: values.addressLine,
    postal_code: values.postalCode,
    city: values.city,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    max_guests: values.maxGuests,
    access_instructions: values.accessInstructions,
    internal_notes: values.internalNotes,
  };
}

export async function createPropertyAction(input: PropertyInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const parsed = parseInput(propertySchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({ business_id: business.id, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error || !data) {
    console.error("create property failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/propriedades");
  redirect(`/propriedades/${data.id}`);
}

export async function updatePropertyAction(propertyId: string, input: PropertyInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const id = idSchema.safeParse(propertyId);
  if (!id.success) return failure("Propriedade não encontrada.");
  const parsed = parseInput(propertySchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .update(toRow(parsed.data))
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("update property failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure("Propriedade não encontrada.");

  revalidatePath("/propriedades");
  redirect(`/propriedades/${id.data}`);
}

/**
 * Arquivar esconde a propriedade das listas e impede novas tarefas, mas
 * mantém o histórico (tarefas, despesas). Não há apagar definitivo: o
 * histórico operacional e financeiro não deve desaparecer por engano.
 */
export async function setPropertyArchivedAction(propertyId: string, archived: boolean): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const id = idSchema.safeParse(propertyId);
  if (!id.success) return failure("Propriedade não encontrada.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("archive property failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure("Propriedade não encontrada.");

  revalidatePath("/propriedades", "layout");
  return success(undefined, archived ? "Propriedade arquivada." : "Propriedade reativada.");
}

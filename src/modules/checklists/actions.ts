"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { checklistTemplateSchema, type ChecklistTemplateInput } from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem alterar as listas de verificação.";

/** Cria (sem id) ou atualiza um modelo. As tarefas já criadas mantêm a sua cópia da lista. */
export async function saveChecklistTemplateAction(
  templateId: string | null,
  input: ChecklistTemplateInput,
): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  if (templateId !== null && !idSchema.safeParse(templateId).success) return failure("Lista não encontrada.");

  const parsed = parseInput(checklistTemplateSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_checklist_template", {
    p_business_id: business.id,
    // O tipo gerado não aceita null, mas a função SQL trata null como "criar".
    p_template_id: templateId as string,
    p_kind: parsed.data.kind,
    p_name: parsed.data.name,
    p_items: parsed.data.items,
  });

  if (error) {
    if (error.code === "P0002") return failure("Lista não encontrada.");
    console.error("save checklist template failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/listas", "layout");
  redirect("/definicoes/listas");
}

export async function setChecklistTemplateActiveAction(templateId: string, active: boolean): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const id = idSchema.safeParse(templateId);
  if (!id.success) return failure("Lista não encontrada.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .update({ is_active: active })
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("toggle checklist template failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure("Lista não encontrada.");

  revalidatePath("/definicoes/listas", "layout");
  return success(undefined, active ? "Lista reativada." : "Lista desativada.");
}

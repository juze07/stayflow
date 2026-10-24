"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { ISSUE_STATUS_LABELS } from "./constants";
import {
  issueFinalCostSchema,
  issueSchema,
  issueStatusSchema,
  type IssueFinalCostInput,
  type IssueInput,
  type IssueStatusInput,
} from "./schemas";

const NOT_FOUND = "Problema não encontrado ou sem permissão para o alterar.";

function issueErrorMessage(error: { code?: string; message?: string } | null) {
  const text = error?.message ?? "";
  if (text.includes("inspection_property_mismatch")) return "A inspeção de origem é de outra propriedade.";
  if (text.includes("only managers can edit this issue")) {
    return "Como responsável, pode alterar apenas o estado e o custo final.";
  }
  if (error?.code === "23503") return "A propriedade ou o responsável escolhido já não existe.";
  return null;
}

function revalidateIssueViews(issueId?: string, propertyId?: string) {
  revalidatePath("/manutencao", "layout");
  revalidatePath("/dashboard");
  if (issueId) revalidatePath(`/manutencao/${issueId}`);
  if (propertyId) revalidatePath(`/propriedades/${propertyId}`);
}

/**
 * Qualquer membro pode reportar um problema. Responsável e custo estimado
 * só são guardados quando quem reporta é administrador ou gestor.
 */
export async function createIssueAction(input: IssueInput): Promise<ActionResult> {
  const { business, role, user } = await requireBusiness();
  const parsed = parseInput(issueSchema, input);
  if (!parsed.ok) return parsed;
  const values = parsed.data;
  const canManage = canManageOperations(role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .insert({
      business_id: business.id,
      property_id: values.propertyId,
      title: values.title,
      description: values.description,
      category: values.category,
      priority: values.priority,
      assignee_id: canManage ? values.assigneeId : null,
      estimated_cost_cents: canManage ? values.estimatedCost : null,
      source_inspection_id: values.sourceInspectionId,
      reported_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    const known = issueErrorMessage(error);
    if (known) return failure(known);
    console.error("create issue failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidateIssueViews(undefined, values.propertyId);
  redirect(`/manutencao/${data.id}`);
}

export async function updateIssueAction(issueId: string, input: IssueInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure("Só administradores e gestores podem editar problemas.");
  const id = idSchema.safeParse(issueId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(issueSchema, input);
  if (!parsed.ok) return parsed;
  const values = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .update({
      property_id: values.propertyId,
      title: values.title,
      description: values.description,
      category: values.category,
      priority: values.priority,
      assignee_id: values.assigneeId,
      estimated_cost_cents: values.estimatedCost,
    })
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");

  if (error) {
    const known = issueErrorMessage(error);
    if (known) return failure(known);
    console.error("update issue failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure(NOT_FOUND);

  revalidateIssueViews(id.data, values.propertyId);
  redirect(`/manutencao/${id.data}`);
}

/** Gestores e o responsável pelo problema mudam o estado (garantido pelo RLS). */
export async function setIssueStatusAction(input: IssueStatusInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(issueStatusSchema, input);
  if (!parsed.ok) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .update({ status: parsed.data.status })
    .eq("business_id", business.id)
    .eq("id", parsed.data.issueId)
    .select("id, property_id");

  if (error) {
    console.error("set issue status failed", error);
    return failure(issueErrorMessage(error) ?? GENERIC_ERROR);
  }
  if (!data?.length) return failure(NOT_FOUND);

  revalidateIssueViews(parsed.data.issueId, data[0].property_id);
  return success(undefined, `Estado alterado para "${ISSUE_STATUS_LABELS[parsed.data.status]}".`);
}

export async function setIssueFinalCostAction(input: IssueFinalCostInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(issueFinalCostSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .update({ final_cost_cents: parsed.data.finalCost })
    .eq("business_id", business.id)
    .eq("id", parsed.data.issueId)
    .select("id");

  if (error) {
    console.error("set issue final cost failed", error);
    return failure(issueErrorMessage(error) ?? GENERIC_ERROR);
  }
  if (!data?.length) return failure(NOT_FOUND);

  revalidateIssueViews(parsed.data.issueId);
  return success(undefined, "Custo final guardado.");
}

export async function deleteIssueAction(issueId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure("Só administradores e gestores podem apagar problemas.");
  const id = idSchema.safeParse(issueId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_issues")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id, property_id");

  if (error) {
    console.error("delete issue failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure(NOT_FOUND);

  revalidateIssueViews(undefined, data[0].property_id);
  redirect("/manutencao");
}

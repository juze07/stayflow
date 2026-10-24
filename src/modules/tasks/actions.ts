"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { zonedDateTimeToUtc } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { TASK_STATUS_LABELS } from "./constants";
import {
  checklistItemSchema,
  inspectionSchema,
  taskNotesSchema,
  taskSchema,
  taskStatusSchema,
  type ChecklistItemInput,
  type InspectionInput,
  type TaskInput,
  type TaskNotesInput,
  type TaskStatusInput,
  type TaskValues,
} from "./schemas";

const NO_PERMISSION = "Só administradores e gestores podem criar e editar tarefas.";
const NOT_FOUND = "Tarefa não encontrada ou sem permissão para a alterar.";

type DbError = { code?: string; message?: string } | null;

/**
 * Traduz as regras aplicadas pela base de dados (triggers e chaves) em
 * mensagens claras. Os nomes técnicos nunca chegam ao utilizador.
 */
function taskErrorMessage(error: DbError): { message: string; field?: keyof TaskInput } | null {
  const text = error?.message ?? "";
  if (text.includes("property_archived")) {
    return { message: "Esta propriedade está arquivada e não recebe tarefas novas.", field: "propertyId" };
  }
  if (text.includes("checklist_incomplete")) {
    return { message: "Marque todos os itens obrigatórios da lista de verificação antes de concluir." };
  }
  if (text.includes("inspection_result_required")) {
    return {
      message: "Registe o resultado da inspeção antes de a concluir.",
    };
  }
  if (text.includes("inspection_observations_required")) {
    return { message: "Descreva o que foi encontrado na inspeção." };
  }
  if (text.includes("task_closed")) {
    return { message: "A tarefa já está concluída ou cancelada. Reabra-a para fazer alterações." };
  }
  if (text.includes("task_type_locked")) {
    return { message: "O tipo de uma limpeza ou inspeção não pode ser alterado depois de criada.", field: "type" };
  }
  if (text.includes("checklist_kind_mismatch")) {
    return { message: "Escolha uma lista de verificação do mesmo tipo da tarefa.", field: "checklistTemplateId" };
  }
  if (text.includes("maintenance_issue_property_mismatch")) {
    return { message: "O problema de manutenção pertence a outra propriedade.", field: "propertyId" };
  }
  if (text.includes("staff can only check items")) {
    return { message: "Como colaborador, pode apenas marcar os itens." };
  }
  if (text.includes("staff can only change status and notes")) {
    return { message: "Como colaborador, pode alterar apenas o estado e as notas das suas tarefas." };
  }
  if (error?.code === "23503") {
    return { message: "A propriedade ou o responsável escolhido já não existe.", field: "propertyId" };
  }
  return null;
}

/** Campos editáveis. A lista de verificação e o problema associado só se definem ao criar. */
function toRow(values: TaskValues, timeZone: string) {
  return {
    property_id: values.propertyId,
    type: values.type,
    title: values.title,
    description: values.description,
    scheduled_at: zonedDateTimeToUtc(values.date, values.time, timeZone).toISOString(),
    estimated_minutes: values.estimatedMinutes,
    assignee_id: values.assigneeId,
    priority: values.priority,
  };
}

function handleWriteError(error: DbError, context: string) {
  const known = taskErrorMessage(error);
  if (known) return failure(known.message, known.field ? { [known.field]: [known.message] } : undefined);
  console.error(context, error);
  return failure(GENERIC_ERROR);
}

function revalidateTaskViews(propertyId?: string) {
  revalidatePath("/tarefas", "layout");
  revalidatePath("/dashboard");
  if (propertyId) revalidatePath(`/propriedades/${propertyId}`);
}

export async function createTaskAction(input: TaskInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const parsed = parseInput(taskSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      business_id: business.id,
      ...toRow(parsed.data, business.timezone),
      checklist_template_id:
        parsed.data.type === "cleaning" || parsed.data.type === "inspection" ? parsed.data.checklistTemplateId : null,
      maintenance_issue_id: parsed.data.maintenanceIssueId,
    })
    .select("id")
    .single();

  if (error || !data) return handleWriteError(error, "create task failed");

  revalidateTaskViews(parsed.data.propertyId);
  redirect(`/tarefas/${data.id}`);
}

export async function updateTaskAction(taskId: string, input: TaskInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const id = idSchema.safeParse(taskId);
  if (!id.success) return failure(NOT_FOUND);
  const parsed = parseInput(taskSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(toRow(parsed.data, business.timezone))
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id");

  if (error) return handleWriteError(error, "update task failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateTaskViews(parsed.data.propertyId);
  redirect(`/tarefas/${id.data}`);
}

/**
 * Muda o estado. Gestores alteram qualquer tarefa; colaboradores só as que
 * lhes estão atribuídas (garantido pelo RLS, não por esta verificação).
 */
export async function setTaskStatusAction(input: TaskStatusInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(taskStatusSchema, input);
  if (!parsed.ok) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("business_id", business.id)
    .eq("id", parsed.data.taskId)
    .select("id, property_id");

  if (error) return handleWriteError(error, "set task status failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateTaskViews(data[0].property_id);
  return success(undefined, `Estado alterado para "${TASK_STATUS_LABELS[parsed.data.status]}".`);
}

/** Notas da execução: o responsável pode escrevê-las, tal como os gestores. */
export async function updateTaskNotesAction(input: TaskNotesInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(taskNotesSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ notes: parsed.data.notes })
    .eq("business_id", business.id)
    .eq("id", parsed.data.taskId)
    .select("id");

  if (error) return handleWriteError(error, "update task notes failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidatePath(`/tarefas/${parsed.data.taskId}`);
  return success(undefined, "Notas guardadas.");
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);

  const id = idSchema.safeParse(taskId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("id, property_id");

  if (error) return handleWriteError(error, "delete task failed");
  if (!data?.length) return failure(NOT_FOUND);

  revalidateTaskViews(data[0].property_id);
  redirect("/tarefas");
}

/** Marca ou desmarca um item da lista (responsável da tarefa ou gestores, garantido pelo RLS). */
export async function setChecklistItemAction(input: ChecklistItemInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(checklistItemSchema, input);
  if (!parsed.ok) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_checklist_items")
    .update({ is_checked: parsed.data.checked })
    .eq("business_id", business.id)
    .eq("id", parsed.data.itemId)
    .select("task_id");

  if (error) return handleWriteError(error, "set checklist item failed");
  if (!data?.length) return failure("Só o responsável pela tarefa e os gestores podem marcar a lista.");

  revalidatePath(`/tarefas/${data[0].task_id}`);
  return success();
}

/** Regista o resultado de uma inspeção, antes de a concluir. */
export async function saveInspectionAction(input: InspectionInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(inspectionSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inspections")
    .update({ result: parsed.data.result, observations: parsed.data.observations })
    .eq("business_id", business.id)
    .eq("task_id", parsed.data.taskId)
    .select("id");

  if (error) {
    const known = taskErrorMessage(error);
    if (known) return failure(known.message);
    console.error("save inspection failed", error);
    return failure(GENERIC_ERROR);
  }
  if (!data?.length) return failure("Só o responsável pela inspeção e os gestores podem registar o resultado.");

  revalidateTaskViews();
  revalidatePath(`/tarefas/${parsed.data.taskId}`);
  return success(undefined, "Resultado guardado. Já pode concluir a inspeção.");
}

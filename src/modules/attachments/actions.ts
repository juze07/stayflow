"use server";

import { revalidatePath } from "next/cache";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { idSchema } from "@/modules/business/schemas";
import { ATTACHMENTS_BUCKET, attachmentFolder, type AttachmentParentType } from "./constants";
import { registerAttachmentSchema, type RegisterAttachmentInput } from "./schemas";

const NOT_FOUND = "Anexo não encontrado ou sem permissão para o apagar.";

function attachmentErrorMessage(error: { code?: string; message?: string } | null) {
  const text = error?.message ?? "";
  if (text.includes("attachment_not_allowed") || error?.code === "42501") {
    return "Sem permissão para anexar ficheiros aqui.";
  }
  if (text.includes("attachment_limit")) return "Já tem o máximo de 20 ficheiros anexados.";
  if (text.includes("attachment_file_missing")) return "O envio do ficheiro não terminou. Tente novamente.";
  if (text.includes("attachment_path_mismatch")) return "Local do ficheiro inválido.";
  if (error?.code === "23503") return "O registo a que quer anexar o ficheiro já não existe.";
  if (error?.code === "23514") return "Formato ou tamanho do ficheiro não suportado.";
  return null;
}

function parentColumns(type: AttachmentParentType, id: string) {
  switch (type) {
    case "task":
      return { task_id: id };
    case "inspection":
      return { inspection_id: id };
    case "maintenance_issue":
      return { maintenance_issue_id: id };
    case "expense":
      return { expense_id: id };
  }
}

function revalidateParent(type: AttachmentParentType, id: string, taskId?: string | null) {
  if (type === "task") revalidatePath(`/tarefas/${id}`);
  if (type === "inspection" && taskId) revalidatePath(`/tarefas/${taskId}`);
  if (type === "maintenance_issue") revalidatePath(`/manutencao/${id}`);
  if (type === "expense") revalidatePath(`/despesas/${id}`);
}

/**
 * Regista um ficheiro já enviado pelo browser para o Storage. A base de dados
 * confirma que o ficheiro existe, foi enviado por este utilizador, está na
 * pasta da entidade e que o utilizador pode anexar a essa entidade.
 */
export async function registerAttachmentAction(input: RegisterAttachmentInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const parsed = parseInput(registerAttachmentSchema, input);
  if (!parsed.ok) return parsed;
  const values = parsed.data;
  const parent = { type: values.parentType, id: values.parentId };
  if (!values.storagePath.startsWith(attachmentFolder(business.id, parent)))
    return failure("Local do ficheiro inválido.");

  const kind =
    values.parentType === "expense" ? "receipt" : values.mimeType === "application/pdf" ? "document" : "photo";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      business_id: business.id,
      storage_path: values.storagePath,
      kind,
      file_name: values.fileName,
      mime_type: values.mimeType,
      size_bytes: values.sizeBytes,
      ...parentColumns(values.parentType, values.parentId),
    })
    .select("id, inspection:inspections (task_id)")
    .single();

  if (error || !data) {
    // O ficheiro enviado fica sem registo: remove-o para não ocupar espaço.
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([values.storagePath]);
    const known = attachmentErrorMessage(error);
    if (known) return failure(known);
    console.error("register attachment failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidateParent(values.parentType, values.parentId, data.inspection?.task_id);
  return success(undefined, "Ficheiro anexado.");
}

/** Gestores apagam qualquer anexo; os restantes membros só os que enviaram (garantido pelo RLS). */
export async function deleteAttachmentAction(attachmentId: string): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const id = idSchema.safeParse(attachmentId);
  if (!id.success) return failure(NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .delete()
    .eq("business_id", business.id)
    .eq("id", id.data)
    .select("storage_path, task_id, inspection_id, maintenance_issue_id, expense_id, inspection:inspections (task_id)");

  if (error) {
    console.error("delete attachment failed", error);
    return failure(GENERIC_ERROR);
  }
  const row = data?.[0];
  if (!row) return failure(NOT_FOUND);

  const { error: storageError } = await supabase.storage.from(ATTACHMENTS_BUCKET).remove([row.storage_path]);
  if (storageError) console.error("remove attachment file failed", storageError);

  if (row.task_id) revalidateParent("task", row.task_id);
  if (row.inspection_id) revalidateParent("inspection", row.inspection_id, row.inspection?.task_id);
  if (row.maintenance_issue_id) revalidateParent("maintenance_issue", row.maintenance_issue_id);
  if (row.expense_id) revalidateParent("expense", row.expense_id);
  return success(undefined, "Ficheiro apagado.");
}

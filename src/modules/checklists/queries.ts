import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import { isChecklistKind, type ChecklistKind } from "./schemas";

export type ChecklistTemplateSummary = {
  id: string;
  name: string;
  kind: ChecklistKind;
  isActive: boolean;
  itemCount: number;
};

export async function listChecklistTemplates(businessId: string): Promise<ChecklistTemplateSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, kind, is_active, items:checklist_template_items (count)")
    .eq("business_id", businessId)
    .order("name", { ascending: true });
  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    isChecklistKind(row.kind)
      ? [
          {
            id: row.id,
            name: row.name,
            kind: row.kind,
            isActive: row.is_active,
            itemCount: row.items[0]?.count ?? 0,
          },
        ]
      : [],
  );
}

/** Modelos ativos de um tipo, para escolher ao criar uma tarefa. */
export async function listTemplateOptions(businessId: string) {
  const templates = await listChecklistTemplates(businessId);
  return templates
    .filter((template) => template.isActive)
    .map((template) => ({ id: template.id, name: template.name, kind: template.kind }));
}

export async function getChecklistTemplate(businessId: string, templateId: string) {
  if (!idSchema.safeParse(templateId).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, kind, is_active, items:checklist_template_items (label, is_required, position)")
    .eq("business_id", businessId)
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isChecklistKind(data.kind)) notFound();

  return {
    id: data.id,
    name: data.name,
    kind: data.kind,
    isActive: data.is_active,
    items: [...data.items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ label: item.label, required: item.is_required })),
  };
}

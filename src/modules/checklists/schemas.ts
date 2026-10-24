import { z } from "@/lib/zod";

export const CHECKLIST_KINDS = ["cleaning", "inspection"] as const;
export type ChecklistKind = (typeof CHECKLIST_KINDS)[number];

export const CHECKLIST_KIND_LABELS: Record<ChecklistKind, string> = {
  cleaning: "Limpeza",
  inspection: "Inspeção",
};

export function isChecklistKind(value: string): value is ChecklistKind {
  return (CHECKLIST_KINDS as readonly string[]).includes(value);
}

export const checklistTemplateSchema = z.object({
  kind: z.enum(CHECKLIST_KINDS, { message: "Escolha o tipo de lista." }),
  name: z
    .string()
    .trim()
    .min(1, { message: "Indique o nome da lista." })
    .max(120, { message: "Máximo de 120 caracteres." }),
  items: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, { message: "Escreva o item ou remova-o." })
          .max(200, { message: "Máximo de 200 caracteres." }),
        required: z.boolean(),
      }),
    )
    .min(1, { message: "Adicione pelo menos um item." })
    .max(100, { message: "Máximo de 100 itens." }),
});
export type ChecklistTemplateInput = z.input<typeof checklistTemplateSchema>;
export type ChecklistTemplateValues = z.output<typeof checklistTemplateSchema>;

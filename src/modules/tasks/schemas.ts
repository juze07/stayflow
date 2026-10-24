import { isCalendarDate, isClockTime } from "@/lib/dates";
import { z } from "@/lib/zod";
import { INSPECTION_RESULTS, TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "./constants";

const optionalLongText = z
  .string()
  .trim()
  .max(4000, { message: "Máximo de 4000 caracteres." })
  .transform((value) => (value === "" ? null : value));

/** Campo de seleção opcional: "" (sem escolha) passa a null. */
const optionalId = z
  .string()
  .trim()
  .refine((value) => value === "" || z.uuid().safeParse(value).success, { message: "Escolha uma opção da lista." })
  .transform((value) => (value === "" ? null : value));

export const taskSchema = z.object({
  propertyId: z.uuid({ message: "Escolha a propriedade." }),
  type: z.enum(TASK_TYPES, { message: "Escolha o tipo de tarefa." }),
  title: z.string().trim().min(1, { message: "Indique um título." }).max(160, { message: "Máximo de 160 caracteres." }),
  description: optionalLongText,
  date: z.string().refine(isCalendarDate, { message: "Indique a data." }),
  time: z.string().refine(isClockTime, { message: "Indique a hora (HH:MM)." }),
  // O formulário envia null quando o campo fica vazio (duração por definir).
  estimatedMinutes: z
    .number({ message: "Indique os minutos." })
    .int({ message: "Use minutos inteiros." })
    .min(1, { message: "O mínimo é 1 minuto." })
    .max(1440, { message: "O máximo é 1440 minutos (24 horas)." })
    .nullable(),
  assigneeId: optionalId,
  priority: z.enum(TASK_PRIORITIES, { message: "Escolha a prioridade." }),
  // Só usados ao criar: a lista de verificação e o problema de manutenção a resolver.
  checklistTemplateId: optionalId,
  maintenanceIssueId: optionalId,
});
export type TaskInput = z.input<typeof taskSchema>;
export type TaskValues = z.output<typeof taskSchema>;

export const taskStatusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(TASK_STATUSES),
});
export type TaskStatusInput = z.input<typeof taskStatusSchema>;

export const taskNotesSchema = z.object({
  taskId: z.uuid(),
  notes: optionalLongText,
});
export type TaskNotesInput = z.input<typeof taskNotesSchema>;

export const checklistItemSchema = z.object({
  itemId: z.uuid(),
  checked: z.boolean(),
});
export type ChecklistItemInput = z.input<typeof checklistItemSchema>;

export const inspectionSchema = z
  .object({
    taskId: z.uuid(),
    result: z.enum(INSPECTION_RESULTS, { message: "Escolha o resultado da inspeção." }),
    observations: optionalLongText,
  })
  .refine((value) => value.result === "approved" || value.observations !== null, {
    message: "Descreva o que foi encontrado.",
    path: ["observations"],
  });
export type InspectionInput = z.input<typeof inspectionSchema>;

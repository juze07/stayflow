import { parseCurrencyToCents } from "@/lib/format";
import { z } from "@/lib/zod";
import { TASK_PRIORITIES } from "@/modules/tasks/constants";
import { ISSUE_CATEGORIES, ISSUE_STATUSES } from "./constants";

const optionalId = z
  .string()
  .trim()
  .refine((value) => value === "" || z.uuid().safeParse(value).success, { message: "Escolha uma opção da lista." })
  .transform((value) => (value === "" ? null : value));

/** Valor em euros escrito pelo utilizador ("45,90"), guardado em cêntimos. Vazio fica por definir. */
const optionalMoney = z
  .string()
  .trim()
  .refine((value) => value === "" || parseCurrencyToCents(value) !== null, { message: "Valor inválido (ex.: 45,90)." })
  .transform((value) => (value === "" ? null : parseCurrencyToCents(value)))
  .refine((cents) => cents === null || cents < 100_000_000, { message: "Valor demasiado alto." });

export const issueSchema = z.object({
  propertyId: z.uuid({ message: "Escolha a propriedade." }),
  title: z
    .string()
    .trim()
    .min(1, { message: "Descreva o problema numa frase." })
    .max(160, { message: "Máximo de 160 caracteres." }),
  description: z
    .string()
    .trim()
    .max(4000, { message: "Máximo de 4000 caracteres." })
    .transform((value) => (value === "" ? null : value)),
  category: z.enum(ISSUE_CATEGORIES, { message: "Escolha a categoria." }),
  priority: z.enum(TASK_PRIORITIES, { message: "Escolha a prioridade." }),
  // Só gestores: responsável e custo estimado (ignorados quando um colaborador reporta).
  assigneeId: optionalId,
  estimatedCost: optionalMoney,
  // Só ao criar a partir de uma inspeção.
  sourceInspectionId: optionalId,
});
export type IssueInput = z.input<typeof issueSchema>;
export type IssueValues = z.output<typeof issueSchema>;

export const issueStatusSchema = z.object({
  issueId: z.uuid(),
  status: z.enum(ISSUE_STATUSES),
});
export type IssueStatusInput = z.input<typeof issueStatusSchema>;

export const issueFinalCostSchema = z.object({
  issueId: z.uuid(),
  finalCost: optionalMoney,
});
export type IssueFinalCostInput = z.input<typeof issueFinalCostSchema>;

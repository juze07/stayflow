import { isCalendarDate } from "@/lib/dates";
import { parseCurrencyToCents } from "@/lib/format";
import { z } from "@/lib/zod";
import { EXPENSE_CATEGORIES } from "./constants";

const optionalId = z
  .string()
  .trim()
  .refine((value) => value === "" || z.uuid().safeParse(value).success, { message: "Escolha uma opção da lista." })
  .transform((value) => (value === "" ? null : value));

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, { message: `Máximo de ${max} caracteres.` })
    .transform((value) => (value === "" ? null : value));
}

export const expenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { message: "Descreva a despesa." })
    .max(200, { message: "Máximo de 200 caracteres." }),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Escolha a categoria." }),
  /** Valor em euros ("45,90"), guardado em cêntimos. */
  amount: z
    .string()
    .trim()
    .min(1, { message: "Indique o valor." })
    .refine((value) => parseCurrencyToCents(value) !== null, { message: "Valor inválido (ex.: 45,90)." })
    .transform((value) => parseCurrencyToCents(value) ?? 0)
    .refine((cents) => cents > 0, { message: "O valor tem de ser superior a zero." })
    .refine((cents) => cents < 100_000_000, { message: "Valor demasiado alto." }),
  incurredOn: z.string().trim().refine(isCalendarDate, { message: "Indique a data." }),
  propertyId: optionalId,
  maintenanceIssueId: optionalId,
  supplier: optionalText(120),
  notes: optionalText(4000),
});
export type ExpenseInput = z.input<typeof expenseSchema>;
export type ExpenseValues = z.output<typeof expenseSchema>;

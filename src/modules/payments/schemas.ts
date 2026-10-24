import { isCalendarDate } from "@/lib/dates";
import { parseCurrencyToCents } from "@/lib/format";
import { z } from "@/lib/zod";
import { PAYMENT_METHODS } from "./constants";

export const paymentSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, { message: "Descreva o pagamento." })
      .max(200, { message: "Máximo de 200 caracteres." }),
    /** Valor em euros ("450,00"), guardado em cêntimos. */
    amount: z
      .string()
      .trim()
      .min(1, { message: "Indique o valor." })
      .refine((value) => parseCurrencyToCents(value) !== null, { message: "Valor inválido (ex.: 450,00)." })
      .transform((value) => parseCurrencyToCents(value) ?? 0)
      .refine((cents) => cents > 0, { message: "O valor tem de ser superior a zero." })
      .refine((cents) => cents < 100_000_000, { message: "Valor demasiado alto." }),
    dueOn: z.string().trim().refine(isCalendarDate, { message: "Indique a data de vencimento." }),
    propertyId: z.uuid({ message: "Escolha a propriedade." }),
    stayId: z
      .string()
      .trim()
      .refine((value) => value === "" || z.uuid().safeParse(value).success, { message: "Escolha uma opção da lista." })
      .transform((value) => (value === "" ? null : value)),
    paid: z.boolean(),
    paidOn: z
      .string()
      .trim()
      .refine((value) => value === "" || isCalendarDate(value), { message: "Data inválida." })
      .transform((value) => (value === "" ? null : value)),
    method: z
      .union([z.enum(PAYMENT_METHODS), z.literal("")], { message: "Escolha uma opção da lista." })
      .transform((value) => (value === "" ? null : value)),
    notes: z
      .string()
      .trim()
      .max(4000, { message: "Máximo de 4000 caracteres." })
      .transform((value) => (value === "" ? null : value)),
  })
  .refine((values) => !values.paid || values.paidOn !== null, {
    message: "Indique a data em que recebeu.",
    path: ["paidOn"],
  });
export type PaymentInput = z.input<typeof paymentSchema>;
export type PaymentValues = z.output<typeof paymentSchema>;

export const markPaidSchema = z.object({
  paidOn: z.string().trim().refine(isCalendarDate, { message: "Indique a data em que recebeu." }),
  method: z.enum(PAYMENT_METHODS, { message: "Escolha o método." }),
});
export type MarkPaidInput = z.input<typeof markPaidSchema>;

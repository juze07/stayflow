import { isCalendarDate } from "@/lib/dates";
import { z } from "@/lib/zod";

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, { message: `Máximo de ${max} caracteres.` })
    .transform((value) => (value === "" ? null : value));
}

export const staySchema = z
  .object({
    propertyId: z.uuid({ message: "Escolha a propriedade." }),
    guestName: z
      .string()
      .trim()
      .min(1, { message: "Indique o nome do inquilino." })
      .max(120, { message: "Máximo de 120 caracteres." }),
    guestEmail: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email({ message: "Indique um email válido." }).max(254)),
    guestPhone: optionalText(30),
    startsOn: z.string().trim().refine(isCalendarDate, { message: "Indique a data de entrada." }),
    endsOn: z
      .string()
      .trim()
      .refine((value) => value === "" || isCalendarDate(value), { message: "Data inválida." })
      .transform((value) => (value === "" ? null : value)),
    notes: optionalText(4000),
  })
  .refine((values) => values.endsOn === null || values.endsOn >= values.startsOn, {
    message: "A saída não pode ser antes da entrada.",
    path: ["endsOn"],
  });
export type StayInput = z.input<typeof staySchema>;
export type StayValues = z.output<typeof staySchema>;

import { z } from "@/lib/zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, { message: `Indique ${label}.` })
    .max(max, { message: `Máximo de ${max} caracteres.` });

const optionalLongText = z
  .string()
  .trim()
  .max(4000, { message: "Máximo de 4000 caracteres." })
  .transform((value) => (value === "" ? null : value));

const count = (label: string, min: number, max: number) =>
  z
    .number({ message: `Indique ${label}.` })
    .int({ message: "Use um número inteiro." })
    .min(min, { message: `O mínimo é ${min}.` })
    .max(max, { message: `O máximo é ${max}.` });

export const propertySchema = z.object({
  name: requiredText("o nome da propriedade", 120),
  addressLine: requiredText("a morada", 200),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{3}$/, { message: "Use o formato 0000-000." }),
  city: requiredText("a localidade", 100),
  bedrooms: count("o número de quartos", 0, 100),
  bathrooms: count("o número de casas de banho", 0, 100),
  maxGuests: count("a capacidade", 1, 500),
  accessInstructions: optionalLongText,
  internalNotes: optionalLongText,
});
export type PropertyInput = z.input<typeof propertySchema>;
export type PropertyValues = z.output<typeof propertySchema>;

export const PROPERTY_STATUSES = ["ativas", "arquivadas"] as const;
export type PropertyStatusFilter = (typeof PROPERTY_STATUSES)[number];

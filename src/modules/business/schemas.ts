import { z } from "@/lib/zod";
import { ROLES } from "./roles";

export const TIMEZONES = [
  { value: "Europe/Lisbon", label: "Portugal Continental (Lisboa)" },
  { value: "Atlantic/Madeira", label: "Madeira" },
  { value: "Atlantic/Azores", label: "Açores" },
  { value: "Europe/Madrid", label: "Espanha (Madrid)" },
  { value: "Europe/London", label: "Reino Unido (Londres)" },
  { value: "Europe/Paris", label: "França (Paris)" },
] as const;

const timezoneValues = TIMEZONES.map((timezone) => timezone.value) as [string, ...string[]];

/** Campo de texto opcional: espaços são removidos e "" passa a null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `Máximo de ${max} caracteres.` })
    .transform((value) => (value === "" ? null : value));

export const businessNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Indique o nome da empresa (mínimo 2 caracteres)." })
  .max(120, { message: "Máximo de 120 caracteres." });

export const createBusinessSchema = z.object({
  name: businessNameSchema,
});
export type CreateBusinessInput = z.input<typeof createBusinessSchema>;

export const businessSettingsSchema = z.object({
  name: businessNameSchema,
  taxId: optionalText(20).refine((value) => value === null || /^\d{9}$/.test(value), {
    message: "O NIF tem 9 dígitos.",
  }),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => value === "" || z.email().safeParse(value).success, { message: "Email inválido." })
    .transform((value) => (value === "" ? null : value.toLowerCase())),
  phone: optionalText(30),
  addressLine: optionalText(200),
  postalCode: optionalText(12).refine((value) => value === null || /^\d{4}-\d{3}$/.test(value), {
    message: "Use o formato 0000-000.",
  }),
  city: optionalText(100),
  timezone: z.enum(timezoneValues, { message: "Escolha um fuso horário da lista." }),
  /** Mostradas aos inquilinos com pagamentos por fazer (ex.: IBAN, MB WAY). */
  paymentInstructions: optionalText(1000),
});
export type BusinessSettingsInput = z.input<typeof businessSettingsSchema>;

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Indique um email válido." })),
  role: z.enum(ROLES, { message: "Escolha uma função." }),
});
export type InviteMemberInput = z.input<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(ROLES),
});

export const idSchema = z.uuid({ message: "Identificador inválido." });

import { z } from "@/lib/zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Indique o seu nome." })
    .max(120, { message: "Máximo de 120 caracteres." }),
  phone: z
    .string()
    .trim()
    .max(30, { message: "Máximo de 30 caracteres." })
    .refine((value) => value === "" || /^\+?[\d\s()-]{6,}$/.test(value), {
      message: "Indique um telefone válido.",
    })
    .transform((value) => (value === "" ? null : value)),
});
export type ProfileInput = z.input<typeof profileSchema>;

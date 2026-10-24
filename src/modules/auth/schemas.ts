import { z } from "@/lib/zod";

export const PASSWORD_MIN_LENGTH = 8;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Indique um email válido." }));

/** Igual à regra configurada no Supabase: 8+ caracteres, com letras e números. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: `A palavra-passe precisa de pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` })
  .max(72, { message: "A palavra-passe pode ter no máximo 72 caracteres." })
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Use letras e números.",
  });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "Indique a palavra-passe." }),
  next: z.string().optional(),
});
export type SignInInput = z.input<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Indique o seu nome." })
    .max(120, { message: "Máximo de 120 caracteres." }),
  email,
  password: passwordSchema,
  next: z.string().optional(),
});
export type SignUpInput = z.input<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

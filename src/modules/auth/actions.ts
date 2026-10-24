"use server";

import { redirect } from "next/navigation";
import { failure, parseInput, success, type ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "./messages";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "./schemas";

export async function signInAction(input: SignInInput): Promise<ActionResult> {
  const parsed = parseInput(signInSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return failure(authErrorMessage(error.code));
  redirect(safeRedirectPath(parsed.data.next));
}

export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = parseInput(signUpSchema, input);
  if (!parsed.ok) return parsed;

  const next = safeRedirectPath(parsed.data.next, "/onboarding");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: siteUrl(`/auth/confirm?next=${encodeURIComponent(next)}`),
    },
  });

  if (error) {
    const fieldErrors = error.code === "weak_password" ? { password: [authErrorMessage(error.code)] } : undefined;
    return failure(authErrorMessage(error.code), fieldErrors);
  }

  // Com a confirmação de email desligada, a sessão já existe.
  if (data.session) redirect(next);
  redirect(`/verificar-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = parseInput(forgotPasswordSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteUrl("/auth/confirm?next=/redefinir-palavra-passe"),
  });

  // Por segurança, a resposta é igual exista ou não uma conta com este email.
  if (error && error.code?.startsWith("over_")) return failure(authErrorMessage(error.code));
  if (error) console.error("reset password email failed", error);

  return success(
    undefined,
    "Se existir uma conta com este email, vai receber um link para definir uma nova palavra-passe.",
  );
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = parseInput(resetPasswordSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return failure("O link expirou. Peça um novo link de recuperação.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return failure(authErrorMessage(error.code));

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

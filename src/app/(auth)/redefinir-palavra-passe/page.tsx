import type { Metadata } from "next";
import { AuthCard } from "@/components/layout/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nova palavra-passe" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nova palavra-passe" description="Escolha uma nova palavra-passe para a sua conta.">
      <ResetPasswordForm />
    </AuthCard>
  );
}

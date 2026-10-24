import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar palavra-passe" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar palavra-passe"
      description="Indique o email da sua conta e enviamos um link para definir uma nova palavra-passe."
      footer={
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Voltar ao início de sessão
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

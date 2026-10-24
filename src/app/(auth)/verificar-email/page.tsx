import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";

export const metadata: Metadata = { title: "Confirme o seu email" };

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Confirme o seu email"
      footer={
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Voltar ao início de sessão
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">
          Enviámos um link de confirmação para o seu email. Abra-o para ativar a conta. Se não o encontrar, verifique a
          pasta de spam.
        </p>
      </div>
    </AuthCard>
  );
}

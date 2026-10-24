import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { SignInForm } from "@/modules/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Aceda à gestão das suas propriedades."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Suspense fallback={null}>
            <AuthSwitchLink href="/registar">Criar conta</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}

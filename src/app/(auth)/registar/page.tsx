import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Comece a organizar as operações da sua empresa."
      footer={
        <>
          Já tem conta?{" "}
          <Suspense fallback={null}>
            <AuthSwitchLink href="/entrar">Entrar</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpForm />
      </Suspense>
    </AuthCard>
  );
}

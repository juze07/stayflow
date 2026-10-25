import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";
import { AcceptInvitationButton } from "@/modules/business/components/accept-invitation-button";
import { CreateBusinessForm } from "@/modules/business/components/create-business-form";
import { getMyPendingInvitations } from "@/modules/business/invitation-queries";
import { requireSession } from "@/modules/business/queries";
import { ROLE_LABELS } from "@/modules/business/roles";
import { AcceptStayInvitationButton } from "@/modules/tenant/components/accept-stay-invitation-button";
import { getMyPendingStayInvitations, hasTenantStays } from "@/modules/tenant/queries";

export const metadata: Metadata = { title: "Criar empresa" };

async function Onboarding() {
  const context = await requireSession();
  if (context.active) redirect("/dashboard");

  // Inquilinos (sem empresa) vão para o seu portal.
  const [invitations, stayInvitations, isTenant] = await Promise.all([
    getMyPendingInvitations(),
    getMyPendingStayInvitations(),
    hasTenantStays(),
  ]);
  if (isTenant) redirect("/inquilino");

  return (
    <div className="space-y-6">
      {invitations.map((invitation) => (
        <Card key={invitation.token}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Tem um convite pendente</p>
              <p className="text-sm text-muted-foreground">
                Foi convidado para {invitation.businessName} como {ROLE_LABELS[invitation.role].toLowerCase()}.
              </p>
            </div>
            <AcceptInvitationButton token={invitation.token} label={`Entrar em ${invitation.businessName}`} />
          </CardContent>
        </Card>
      ))}

      {stayInvitations.map((invitation) => (
        <Card key={invitation.token}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">É inquilino?</p>
              <p className="text-sm text-muted-foreground">
                {invitation.businessName} associou-o à estadia em {invitation.propertyName}.
              </p>
            </div>
            <AcceptStayInvitationButton token={invitation.token} />
          </CardContent>
        </Card>
      ))}

      <AuthCard
        title={
          invitations.length > 0 || stayInvitations.length > 0 ? "Ou crie a sua própria empresa" : "Crie a sua empresa"
        }
        description="A empresa agrupa as suas propriedades, a equipa e todos os registos. Os dados de cada empresa são privados."
      >
        <CreateBusinessForm />
      </AuthCard>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="mb-10">
        <Logo />
      </div>
      <main className="w-full max-w-sm animate-fade-up">
        <Suspense fallback={<FormSkeleton fields={1} />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}

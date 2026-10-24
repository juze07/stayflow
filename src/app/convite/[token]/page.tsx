import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Logo } from "@/components/layout/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { AcceptInvitationButton } from "@/modules/business/components/accept-invitation-button";
import { getInvitationPreview } from "@/modules/business/invitation-queries";
import { requireSession } from "@/modules/business/queries";
import { ROLE_LABELS } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";

export const metadata: Metadata = { title: "Convite" };

const STATUS_MESSAGES = {
  accepted: "Este convite já foi aceite.",
  expired: "Este convite expirou. Peça um novo convite a quem o enviou.",
  revoked: "Este convite foi cancelado.",
} as const;

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await requireSession();
  const parsedToken = idSchema.safeParse(token);
  const validToken = parsedToken.success ? parsedToken.data : null;
  const invitation = validToken ? await getInvitationPreview(validToken) : null;

  if (!validToken || !invitation) {
    return (
      <AuthCard title="Convite inválido">
        <Alert tone="danger">Não encontrámos este convite. Confirme o link que recebeu.</Alert>
      </AuthCard>
    );
  }

  const wrongAccount = invitation.email !== session.user.email.toLowerCase();

  return (
    <AuthCard title={`Convite para ${invitation.businessName}`} description={`Função: ${ROLE_LABELS[invitation.role]}`}>
      {invitation.status !== "pending" ? (
        <div className="space-y-4">
          <Alert tone="warning">{STATUS_MESSAGES[invitation.status]}</Alert>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      ) : wrongAccount ? (
        <div className="space-y-4">
          <Alert tone="warning">
            Este convite foi enviado para {invitation.email}, mas tem sessão iniciada como {session.user.email}. Termine
            a sessão e entre (ou crie conta) com o email convidado.
          </Alert>
          <SignOutButton />
        </div>
      ) : (
        <AcceptInvitationButton token={validToken} />
      )}
    </AuthCard>
  );
}

export default function InvitationPage({ params }: PageProps<"/convite/[token]">) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="mb-10">
        <Logo />
      </div>
      <main className="w-full max-w-sm animate-fade-up">
        <Suspense fallback={<FormSkeleton fields={1} />}>
          <Invitation params={params} />
        </Suspense>
      </main>
    </div>
  );
}

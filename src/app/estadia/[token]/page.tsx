import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Logo } from "@/components/layout/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireSession } from "@/modules/business/queries";
import { idSchema } from "@/modules/business/schemas";
import { stayPeriod } from "@/modules/stays/components/stay-list";
import { AcceptStayInvitationButton } from "@/modules/tenant/components/accept-stay-invitation-button";
import { getStayInvitationPreview } from "@/modules/tenant/queries";

export const metadata: Metadata = { title: "A sua estadia" };

async function StayInvitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await requireSession();
  const parsedToken = idSchema.safeParse(token);
  const validToken = parsedToken.success ? parsedToken.data : null;
  const invitation = validToken ? await getStayInvitationPreview(validToken) : null;

  if (!validToken || !invitation || invitation.status === "cancelled") {
    return (
      <AuthCard title="Link inválido">
        <Alert tone="danger">Este link já não é válido. Peça um novo à empresa.</Alert>
      </AuthCard>
    );
  }

  const wrongAccount = invitation.email !== session.user.email.toLowerCase();

  return (
    <AuthCard
      title={invitation.propertyName}
      description={`${invitation.businessName} · ${stayPeriod(invitation.startsOn, invitation.endsOn)}`}
    >
      {wrongAccount ? (
        <div className="space-y-4">
          <Alert tone="warning">
            Este link foi enviado para {invitation.email}, mas tem sessão iniciada como {session.user.email}. Termine a
            sessão e entre (ou crie conta) com o email da reserva.
          </Alert>
          <SignOutButton />
        </div>
      ) : invitation.status === "accepted" ? (
        <Button asChild className="w-full">
          <Link href="/inquilino">Abrir a minha estadia</Link>
        </Button>
      ) : (
        <AcceptStayInvitationButton token={validToken} />
      )}
    </AuthCard>
  );
}

export default function StayInvitationPage({ params }: PageProps<"/estadia/[token]">) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="mb-10">
        <Logo />
      </div>
      <main className="w-full max-w-sm animate-fade-up">
        <Suspense fallback={<FormSkeleton fields={1} />}>
          <StayInvitation params={params} />
        </Suspense>
      </main>
    </div>
  );
}

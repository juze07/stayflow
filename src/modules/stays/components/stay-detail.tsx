import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { zonedToday } from "@/lib/dates";
import { siteUrl } from "@/lib/env";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { IssueList } from "@/modules/maintenance/components/issue-list";
import { listStayIssues } from "@/modules/maintenance/queries";
import { PaymentList } from "@/modules/payments/components/payment-list";
import { listStayPayments } from "@/modules/payments/queries";
import { stayStatus } from "../constants";
import { getStay } from "../queries";
import { StayAccessActions, StayLifecycleActions } from "./stay-actions";
import { StayStatusBadge } from "./stay-badges";
import { stayPeriod } from "./stay-list";
import { StaysManagersOnly } from "./stays-only";

export async function StayDetailView({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const stay = await getStay(business.id, id);
  const [payments, issues] = await Promise.all([
    listStayPayments(business.id, stay.id),
    listStayIssues(business.id, stay.id),
  ]);
  const today = zonedToday(business.timezone, requestTime());
  const status = stayStatus(stay, today);
  const pendingCents = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amountCents, 0);
  const paidCents = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/estadias"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Estadias
      </Link>
      <PageHeader
        title={stay.guestName}
        description={`${stay.property?.name ?? "Propriedade removida"} · ${stayPeriod(stay.startsOn, stay.endsOn)}`}
        actions={
          <Button variant="secondary" asChild>
            <Link href={`/estadias/${stay.id}/editar`}>
              <Pencil aria-hidden />
              Editar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Pagamentos</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/receitas/novo?estadia=${stay.id}`}>
                    <Plus aria-hidden />
                    Pagamento
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Recebido {formatCurrency(paidCents)} · por receber {formatCurrency(pendingCents)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentList
                payments={payments}
                today={today}
                hideStay
                empty={{
                  title: "Sem pagamentos",
                  description: "Registe a renda ou o valor da reserva. O inquilino vê-os no portal.",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problemas reportados</CardTitle>
              <CardDescription>Os problemas que o inquilino reporta entram na Manutenção.</CardDescription>
            </CardHeader>
            <CardContent>
              <IssueList
                issues={issues}
                timeZone={business.timezone}
                hideProperty
                empty={{ title: "Sem problemas reportados" }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Inquilino</CardTitle>
                <StayStatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="break-all text-foreground">{stay.guestEmail}</dd>
                </div>
                {stay.guestPhone && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Telefone</dt>
                    <dd className="text-foreground">{stay.guestPhone}</dd>
                  </div>
                )}
              </dl>
              {stay.cancelledAt ? (
                <Alert tone="warning">Estadia cancelada: o inquilino não a vê no portal.</Alert>
              ) : stay.linked ? (
                <Alert tone="success">
                  Portal ativo{stay.tenantName ? ` para ${stay.tenantName}` : ""}
                  {stay.inviteAcceptedAt ? ` desde ${formatDateTime(stay.inviteAcceptedAt, business.timezone)}` : ""}.
                </Alert>
              ) : (
                <p className="text-muted-foreground">
                  Envie o link de acesso ao inquilino (ex.: por WhatsApp). Só funciona com uma conta com o email{" "}
                  {stay.guestEmail}.
                </p>
              )}
              {!stay.cancelledAt && (
                <StayAccessActions
                  stayId={stay.id}
                  link={siteUrl(`/estadia/${stay.inviteToken}`)}
                  linked={stay.linked}
                />
              )}
            </CardContent>
          </Card>

          {stay.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-foreground">{stay.notes}</p>
              </CardContent>
            </Card>
          )}

          <StayLifecycleActions stayId={stay.id} cancelled={stay.cancelledAt !== null} />
        </div>
      </div>
    </div>
  );
}

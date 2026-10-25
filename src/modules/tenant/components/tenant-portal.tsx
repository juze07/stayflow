import { CalendarDays, KeyRound, Mail, MapPin, Phone, Wallet, Wrench } from "@/components/ui/icons";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzulejoPattern } from "@/components/layout/azulejo-pattern";
import { EmptyState } from "@/components/ui/empty-state";
import { zonedToday } from "@/lib/dates";
import { firstName, formatCurrency, formatDate } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireSession } from "@/modules/business/queries";
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_TONES } from "@/modules/maintenance/constants";
import { PaymentStatusBadge } from "@/modules/payments/components/payment-badges";
import { StripeActionButton } from "@/modules/stripe/components/stripe-action-button";
import { TenantBankTransfer } from "@/modules/stripe/components/tenant-bank-transfer";
import { getMyPaymentOptions, type TenantPaymentOptions } from "@/modules/stripe/queries";
import { getMyIssues, getMyPayments, getMyPendingStayInvitations, getMyStays, type TenantStay } from "../queries";
import { AcceptStayInvitationButton } from "./accept-stay-invitation-button";
import { ReportIssueForm } from "./report-issue-form";
import { ReportPaymentButton } from "./report-payment-button";
import type { TenantIssue, TenantPayment } from "../queries";

export async function TenantPortal({ paymentDone = false }: { paymentDone?: boolean }) {
  const session = await requireSession();
  const [stays, payments, issues, invitations, paymentOptions] = await Promise.all([
    getMyStays(),
    getMyPayments(),
    getMyIssues(),
    getMyPendingStayInvitations(),
    getMyPaymentOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-[32px] leading-tight text-foreground sm:text-4xl">
          Olá, {firstName(session.profile.fullName, session.user.email)}
        </h1>
        <p className="text-sm text-muted-foreground">A sua estadia, pagamentos e pedidos de reparação.</p>
      </div>

      {paymentDone && <Alert tone="success">Pagamento concluído. Fica marcado como pago dentro de momentos.</Alert>}

      {invitations.map((invitation) => (
        <Card key={invitation.token} className="border-primary/25 bg-primary-soft/40">
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">
              {invitation.businessName} convidou-o para a estadia em {invitation.propertyName}.
            </p>
            <AcceptStayInvitationButton token={invitation.token} />
          </CardContent>
        </Card>
      ))}

      {stays.length === 0 && invitations.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Ainda não tem estadias"
          description="Abra o link que a empresa lhe enviou, com a conta do email que indicou na reserva."
          action={
            session.memberships.length > 0 ? (
              <Button variant="secondary" asChild>
                <Link href="/dashboard">Ir para a área da empresa</Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {stays.map((stay) => (
        <StayCard
          key={stay.id}
          stay={stay}
          today={zonedToday(stay.businessTimezone, requestTime())}
          payments={payments.filter((p) => p.stayId === stay.id)}
          issues={issues.filter((i) => i.stayId === stay.id)}
          paymentOptions={paymentOptions.find((o) => o.stayId === stay.id)}
        />
      ))}
    </div>
  );
}

function StayCard({
  stay,
  today,
  payments,
  issues,
  paymentOptions,
}: {
  stay: TenantStay;
  today: string;
  payments: TenantPayment[];
  issues: TenantIssue[];
  paymentOptions?: TenantPaymentOptions;
}) {
  const online = paymentOptions?.onlinePayments ? paymentOptions : null;
  const due = payments.filter((p) => p.status === "pending");
  const dueCents = due.reduce((sum, p) => sum + p.amountCents, 0);
  const tz = stay.businessTimezone;

  return (
    <section className="space-y-4" aria-labelledby={`stay-${stay.id}`}>
      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-ink px-5 pt-5 pb-6 text-ink-foreground">
          <AzulejoPattern
            columns={8}
            rows={3}
            className="absolute inset-y-0 -right-6 w-80 text-[#8fa8ff] [mask-image:linear-gradient(to_left,black,transparent)]"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] font-medium text-white/60">{stay.businessName}</p>
              <h2 id={`stay-${stay.id}`} className="font-display text-3xl leading-tight">
                {stay.propertyName}
              </h2>
            </div>
            <StayPhaseBadge startsOn={stay.startsOn} endsOn={stay.endsOn} today={today} />
          </div>
        </div>
        <div className="space-y-4 p-5">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
            <div className="bg-surface-raised px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Entrada</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {formatDate(stay.startsOn, "UTC")}
              </dd>
            </div>
            <div className="bg-surface-raised px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Saída</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {stay.endsOn ? formatDate(stay.endsOn, "UTC") : "Sem data definida"}
              </dd>
            </div>
          </dl>
          <p className="flex items-start gap-2 text-sm text-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />
            {stay.address}
          </p>
          {stay.accessInstructions ? (
            <div className="rounded-lg border border-border bg-surface-raised p-3.5 text-sm">
              <p className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <KeyRound className="size-4" aria-hidden />
                Instruções de acesso
              </p>
              <p className="whitespace-pre-line text-foreground">{stay.accessInstructions}</p>
            </div>
          ) : (
            stay.startsOn > today && (
              <p className="text-xs text-muted-foreground">As instruções de acesso aparecem na véspera da entrada.</p>
            )
          )}
        </div>
        {(stay.businessPhone || stay.businessEmail) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-raised px-5 py-3">
            <p className="mr-auto text-[13px] text-muted-foreground">Precisa de ajuda?</p>
            {stay.businessPhone && (
              <Button size="sm" variant="secondary" asChild>
                <a href={`tel:${stay.businessPhone.replace(/\s+/g, "")}`}>
                  <Phone aria-hidden />
                  Ligar
                </a>
              </Button>
            )}
            {stay.businessEmail && (
              <Button size="sm" variant="secondary" asChild>
                <a href={`mailto:${stay.businessEmail}`}>
                  <Mail aria-hidden />
                  Email
                </a>
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-subtle-foreground" aria-hidden />
            Pagamentos
          </CardTitle>
          <CardDescription>
            {due.length > 0 ? `Por pagar: ${formatCurrency(dueCents)}` : "Não tem pagamentos em falta."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {online && (due.length > 0 || online.iban) && <TenantBankTransfer option={online} />}
          {due.length > 0 && !online && (
            <Alert tone="info">
              {stay.paymentInstructions ? (
                <span className="whitespace-pre-line">{stay.paymentInstructions}</span>
              ) : (
                "Contacte a empresa para saber como pagar."
              )}
              <span className="mt-1 block text-xs">Depois de pagar, carregue em &quot;Já paguei&quot;.</span>
            </Alert>
          )}
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há pagamentos registados.</p>
          ) : (
            <ul className="-my-3 divide-y divide-border">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{payment.description}</p>
                      <PaymentStatusBadge status={payment.status} overdue={payment.dueOn < today} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payment.status === "paid" && payment.paidOn
                        ? `Pago a ${formatDate(payment.paidOn, "UTC")}`
                        : `Até ${formatDate(payment.dueOn, "UTC")}`}
                    </p>
                    {payment.status === "pending" && payment.reportedAt && (
                      <p className="text-xs font-medium text-info">
                        Avisou a empresa a {formatDate(payment.reportedAt, tz)}. A aguardar confirmação.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(payment.amountCents)}
                    </span>
                    {payment.status === "pending" && online && (
                      <StripeActionButton action="card" id={payment.id}>
                        Pagar com cartão
                      </StripeActionButton>
                    )}
                    {payment.status === "pending" && !payment.reportedAt && !online && (
                      <ReportPaymentButton paymentId={payment.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4 text-subtle-foreground" aria-hidden />
            Reportar um problema
          </CardTitle>
          <CardDescription>A empresa recebe o pedido e acompanha a reparação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ReportIssueForm stayId={stay.id} />
          {issues.length > 0 && (
            <ul className="divide-y divide-border border-t border-border">
              {issues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(issue.reportedAt, tz)}</p>
                  </div>
                  <Badge tone={ISSUE_STATUS_TONES[issue.status]}>{ISSUE_STATUS_LABELS[issue.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StayPhaseBadge({ startsOn, endsOn, today }: { startsOn: string; endsOn: string | null; today: string }) {
  if (startsOn > today) return <Badge tone="info">Próxima</Badge>;
  if (endsOn && endsOn < today) return <Badge>Terminada</Badge>;
  return <Badge tone="success">A decorrer</Badge>;
}

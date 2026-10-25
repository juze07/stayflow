import { Wallet } from "@/components/ui/icons";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "../constants";
import type { PaymentListItem } from "../queries";
import { PaymentStatusBadge } from "./payment-badges";
import { PaymentRowActions } from "./payment-row-actions";

type PaymentListProps = {
  payments: PaymentListItem[];
  today: string;
  hideStay?: boolean;
  empty: { title: string; description?: ReactNode; action?: ReactNode };
};

export function PaymentList({ payments, today, hideStay, empty }: PaymentListProps) {
  if (payments.length === 0) {
    return <EmptyState icon={Wallet} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {payments.map((payment) => (
          <li key={payment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{payment.description}</p>
                <PaymentStatusBadge status={payment.status} overdue={payment.dueOn < today} />
              </div>
              <p className="text-xs text-muted-foreground">
                {/* Datas civis: formatadas em UTC para não mudarem de dia. */}
                {payment.status === "paid" && payment.paidOn
                  ? `Recebido a ${formatDate(payment.paidOn, "UTC")}`
                  : `Vence a ${formatDate(payment.dueOn, "UTC")}`}
                {payment.method && ` · ${PAYMENT_METHOD_LABELS[payment.method]}`}
                {` · ${payment.property?.name ?? "Propriedade removida"}`}
                {!hideStay && payment.stay && ` · ${payment.stay.guestName}`}
              </p>
              {payment.status === "pending" && payment.tenantReportedAt && (
                <p className="text-xs font-medium text-info">
                  O inquilino indicou que pagou{payment.tenantReference ? `: ${payment.tenantReference}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(payment.amountCents)}
              </span>
              <PaymentRowActions
                paymentId={payment.id}
                status={payment.status}
                today={today}
                defaultMethod={payment.method ?? "transfer"}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

"use client";

import { Check, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deletePaymentAction, markPaymentPaidAction, setPaymentStatusAction } from "../actions";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type PaymentMethod, type PaymentStatus } from "../constants";

type PaymentRowActionsProps = {
  paymentId: string;
  status: PaymentStatus;
  today: string;
  defaultMethod: PaymentMethod;
};

/** Ações rápidas de um pagamento: confirmar recebimento, cancelar, editar ou apagar. */
export function PaymentRowActions({ paymentId, status, today, defaultMethod }: PaymentRowActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [paidOn, setPaidOn] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) setError(result.error ?? "Erro.");
      else setConfirming(false);
    });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        {status === "pending" && !confirming && (
          <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
            <Check aria-hidden />
            Recebido
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Mais ações" disabled={isPending}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/receitas/${paymentId}/editar`}>Editar</Link>
            </DropdownMenuItem>
            {status !== "pending" && (
              <DropdownMenuItem onSelect={() => run(() => setPaymentStatusAction(paymentId, "pending"))}>
                Voltar a por receber
              </DropdownMenuItem>
            )}
            {status !== "cancelled" && (
              <DropdownMenuItem onSelect={() => run(() => setPaymentStatusAction(paymentId, "cancelled"))}>
                Cancelar pagamento
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onSelect={() => run(() => deletePaymentAction(paymentId))}>
              Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {confirming && (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-xs text-muted-foreground">
            Recebido em
            <Input type="date" value={paidOn} max={today} onChange={(event) => setPaidOn(event.target.value)} />
          </label>
          <label className="flex-1 space-y-1 text-xs text-muted-foreground">
            Método
            <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_METHOD_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={isPending}>
              Voltar
            </Button>
            <Button
              size="sm"
              loading={isPending}
              onClick={() => run(() => markPaymentPaidAction(paymentId, { paidOn, method }))}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

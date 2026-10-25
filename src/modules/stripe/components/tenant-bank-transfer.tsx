import { Landmark } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import type { TenantPaymentOptions } from "../queries";
import { formatIban } from "../schemas";
import { StripeActionButton } from "./stripe-action-button";

/** IBAN só deste inquilino: as transferências recebidas são associadas automaticamente. */
export function TenantBankTransfer({ option }: { option: TenantPaymentOptions }) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-foreground">
        <Landmark className="size-4 text-muted-foreground" aria-hidden />
        Pagar por transferência
      </p>
      {option.iban ? (
        <>
          <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="text-xs text-muted-foreground">IBAN</dt>
            <dd className="font-mono text-foreground">{formatIban(option.iban.iban)}</dd>
            {option.iban.bic && (
              <>
                <dt className="text-xs text-muted-foreground">BIC/SWIFT</dt>
                <dd className="font-mono text-foreground">{option.iban.bic}</dd>
              </>
            )}
            {option.iban.accountHolderName && (
              <>
                <dt className="text-xs text-muted-foreground">Titular</dt>
                <dd className="text-foreground">{option.iban.accountHolderName}</dd>
              </>
            )}
            {option.iban.bankName && (
              <>
                <dt className="text-xs text-muted-foreground">Banco</dt>
                <dd className="text-foreground">{option.iban.bankName}</dd>
              </>
            )}
          </dl>
          <CopyButton value={option.iban.iban} label="Copiar IBAN" />
          <p className="text-xs text-muted-foreground">
            Este IBAN é só seu e não muda. Transfira o valor em falta; o pagamento fica confirmado automaticamente
            quando a transferência chegar (normalmente 1 dia útil). Use como titular o nome indicado acima.
          </p>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">Receba um IBAN só seu para pagar sem ter de avisar a empresa.</p>
          <StripeActionButton action="iban" id={option.stayId} variant="secondary">
            Mostrar o meu IBAN
          </StripeActionButton>
        </>
      )}
    </div>
  );
}

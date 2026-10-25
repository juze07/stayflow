import type Stripe from "stripe";
import type { StripeDb } from "./db";
import { accountIdSchema, customerIdSchema, paymentMetadataSchema } from "./schemas";
import {
  applyCashBalance,
  closeOtherPaymentAttempts,
  paymentIntentMethod,
  refundDuplicatePayment,
  syncAccountStatus,
} from "./service";

/** Eventos que o endpoint do webhook tem de receber (contas ligadas). */
export const HANDLED_EVENTS = ["account.updated", "payment_intent.succeeded", "cash_balance.funds_available"] as const;

/**
 * Processa um evento já verificado (assinatura válida). Idempotente: eventos
 * repetidos são ignorados e cada escrita pode ser repetida sem efeitos.
 */
export async function handleStripeEvent(event: Stripe.Event, deps: { stripe: Stripe; db: StripeDb }): Promise<string> {
  const { stripe, db } = deps;
  if (await db.eventProcessed(event.id)) return "duplicate";

  const account = accountIdSchema.safeParse(event.account);
  let outcome = "ignored";

  if (account.success) {
    switch (event.type) {
      case "account.updated": {
        // Contas v2: o estado vem sempre da Stripe, não do conteúdo do evento.
        await syncAccountStatus(stripe, db, account.data);
        outcome = "account_updated";
        break;
      }
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const metadata = paymentMetadataSchema.safeParse(intent.metadata);
        if (!metadata.success) break;
        const paymentId = metadata.data.stayflow_payment_id;
        const before = await db.paymentContext(paymentId);
        outcome = await db.markPaymentPaid({
          accountId: account.data,
          paymentId,
          paymentIntentId: intent.id,
          amountCents: intent.amount_received,
          method: paymentIntentMethod(intent),
        });

        const paidByThisIntent =
          outcome === "paid" || (outcome === "already_paid" && before?.paymentIntentId === intent.id);
        if (paidByThisIntent) {
          await closeOtherPaymentAttempts(stripe, account.data, {
            paymentId,
            customerId: typeof intent.customer === "string" ? intent.customer : (intent.customer?.id ?? null),
            paidIntentId: intent.id,
            previousIntentId: outcome === "paid" ? (before?.paymentIntentId ?? null) : null,
          });
        } else if (outcome === "already_paid" || outcome === "not_pending") {
          // Pago duas vezes (ou depois de cancelado): o inquilino recebe o dinheiro de volta.
          await refundDuplicatePayment(stripe, account.data, intent.id);
          outcome = "refunded";
        } else {
          console.warn("stripe payment not applied", { event: event.id, intent: intent.id, outcome });
        }
        break;
      }
      case "cash_balance.funds_available": {
        const customer = customerIdSchema.safeParse(event.data.object.customer);
        if (!customer.success) break;
        const paid = await applyCashBalance(stripe, db, account.data, customer.data);
        outcome = `balance_applied:${paid}`;
        break;
      }
    }
  }

  await db.recordEvent(event.id, event.type);
  return outcome;
}

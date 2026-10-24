import type Stripe from "stripe";
import { STRIPE_CURRENCY, VIRTUAL_IBAN_COUNTRY } from "./constants";
import type { PaymentContext, StayContext, StripeDb } from "./db";
import { parseVirtualIban, type VirtualIban } from "./schemas";

type ConnectedStay = StayContext & { accountId: string };

/** Cliente Stripe da estadia, na conta da empresa. Criado uma única vez. */
export async function ensureStayCustomer(stripe: Stripe, db: StripeDb, stay: ConnectedStay): Promise<string> {
  if (stay.customerId) return stay.customerId;

  const customer = await stripe.customers.create(
    {
      name: stay.guestName,
      email: stay.guestEmail,
      metadata: { stayflow_stay_id: stay.stayId },
    },
    { stripeAccount: stay.accountId, idempotencyKey: `stayflow-customer-${stay.stayId}` },
  );
  // Se outro pedido guardou primeiro, fica o que já estava registado.
  return db.saveStayCustomer(stay.stayId, customer.id);
}

/** IBAN virtual da estadia: permanente, só desta estadia. */
export async function ensureStayIban(stripe: Stripe, db: StripeDb, stay: ConnectedStay): Promise<VirtualIban> {
  const customerId = await ensureStayCustomer(stripe, db, stay);
  const instructions = await stripe.customers.createFundingInstructions(
    customerId,
    {
      funding_type: "bank_transfer",
      currency: STRIPE_CURRENCY,
      bank_transfer: { type: "eu_bank_transfer", eu_bank_transfer: { country: VIRTUAL_IBAN_COUNTRY } },
    },
    { stripeAccount: stay.accountId },
  );
  const iban = parseVirtualIban(instructions);
  if (!iban) throw new Error("A Stripe não devolveu um IBAN nas instruções de transferência.");
  await db.saveStayIban(stay.stayId, iban);
  return iban;
}

/** Página de pagamento por cartão (Stripe Checkout) na conta da empresa. */
export async function createCardCheckout(
  stripe: Stripe,
  db: StripeDb,
  stay: ConnectedStay,
  payment: PaymentContext,
  urls: { success: string; cancel: string },
): Promise<string> {
  const customerId = await ensureStayCustomer(stripe, db, stay);
  const metadata = { stayflow_payment_id: payment.paymentId };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer: customerId,
      allowed_payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: payment.amountCents,
            product_data: { name: payment.description },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: urls.success,
      cancel_url: urls.cancel,
    },
    { stripeAccount: stay.accountId },
  );
  if (!session.url) throw new Error("A Stripe não devolveu o endereço do pagamento.");
  return session.url;
}

export function paymentIntentMethod(paymentIntent: Pick<Stripe.PaymentIntent, "payment_method_types">) {
  return paymentIntent.payment_method_types.includes("customer_balance") ? "transfer" : "card";
}

/**
 * Chegou dinheiro ao IBAN da estadia e sobrou saldo: aplica-o aos pagamentos
 * por receber, do mais antigo para o mais recente. Cada pagamento recebe um
 * PaymentIntent de saldo do cliente; se o saldo chegar, fica logo pago.
 * Pára no primeiro pagamento que o saldo não cobre.
 */
export async function applyCashBalance(
  stripe: Stripe,
  db: StripeDb,
  accountId: string,
  customerId: string,
): Promise<number> {
  const pending = await db.pendingPaymentsForCustomer(accountId, customerId);
  let paid = 0;

  for (const payment of pending) {
    let intent: Stripe.PaymentIntent | null = null;

    if (payment.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(payment.paymentIntentId, {}, { stripeAccount: accountId });
      if (existing.payment_method_types.includes("customer_balance")) intent = existing;
    }

    if (!intent) {
      intent = await stripe.paymentIntents.create(
        {
          amount: payment.amountCents,
          currency: STRIPE_CURRENCY,
          customer: customerId,
          allowed_payment_method_types: ["customer_balance"],
          payment_method_data: { type: "customer_balance" },
          payment_method_options: {
            customer_balance: {
              funding_type: "bank_transfer",
              bank_transfer: { type: "eu_bank_transfer", eu_bank_transfer: { country: VIRTUAL_IBAN_COUNTRY } },
            },
          },
          confirm: true,
          description: payment.description,
          metadata: { stayflow_payment_id: payment.paymentId },
        },
        { stripeAccount: accountId, idempotencyKey: `stayflow-balance-${payment.paymentId}-${payment.amountCents}` },
      );
      await db.attachPaymentIntent(payment.paymentId, intent.id);
    }

    if (intent.status !== "succeeded") break;

    const result = await db.markPaymentPaid({
      accountId,
      paymentId: payment.paymentId,
      paymentIntentId: intent.id,
      amountCents: intent.amount_received,
      method: "transfer",
    });
    if (result === "paid") paid += 1;
  }

  return paid;
}

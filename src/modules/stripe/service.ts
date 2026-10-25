import type Stripe from "stripe";
import { STRIPE_ACCOUNT_COUNTRY, STRIPE_CURRENCY, VIRTUAL_IBAN_COUNTRY } from "./constants";
import type { PaymentContext, StayContext, StripeDb } from "./db";
import { parseVirtualIban, type VirtualIban } from "./schemas";

type ConnectedStay = StayContext & { accountId: string };

/**
 * Conta ligada da empresa (Accounts v2): painel Stripe próprio, a Stripe cobra
 * as comissões à empresa e responde por saldos negativos.
 */
export async function createConnectedAccount(stripe: Stripe, business: { id: string; name: string }): Promise<string> {
  const account = await stripe.v2.core.accounts.create(
    {
      display_name: business.name,
      dashboard: "full",
      identity: { country: STRIPE_ACCOUNT_COUNTRY.toLowerCase() },
      defaults: {
        currency: STRIPE_CURRENCY,
        responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
      },
      configuration: {
        merchant: {
          capabilities: {
            card_payments: { requested: true },
            sepa_bank_transfer_payments: { requested: true },
          },
        },
      },
      metadata: { stayflow_business_id: business.id },
    },
    { idempotencyKey: `stayflow-account-v2-${business.id}` },
  );
  return account.id;
}

export function createOnboardingLink(stripe: Stripe, accountId: string, urls: { refresh: string; return: string }) {
  return stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: { refresh_url: urls.refresh, return_url: urls.return },
    },
  });
}

/** Estado atual da conta ligada, lido da Stripe. */
export async function readAccountStatus(stripe: Stripe, accountId: string) {
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.merchant", "requirements"],
  });
  const chargesEnabled = account.configuration?.merchant?.capabilities?.card_payments?.status === "active";
  const detailsSubmitted = chargesEnabled || (account.requirements?.entries?.length ?? 0) === 0;
  return { chargesEnabled, detailsSubmitted };
}

/** Lê o estado na Stripe e guarda-o na base de dados. */
export async function syncAccountStatus(stripe: Stripe, db: StripeDb, accountId: string) {
  const status = await readAccountStatus(stripe, accountId);
  await db.updateAccount(accountId, status.chargesEnabled, status.detailsSubmitted);
  return status;
}

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

/**
 * O pagamento ficou pago com `paidIntentId`: fecha as páginas de cartão ainda
 * abertas para ele e cancela a transferência que estava à espera de saldo,
 * para o inquilino não pagar duas vezes. Pode ser repetida sem efeitos.
 */
export async function closeOtherPaymentAttempts(
  stripe: Stripe,
  accountId: string,
  input: { paymentId: string; customerId: string | null; paidIntentId: string; previousIntentId: string | null },
) {
  const options = { stripeAccount: accountId };

  if (input.customerId) {
    const sessions = await stripe.checkout.sessions.list(
      { customer: input.customerId, status: "open", limit: 100 },
      options,
    );
    for (const session of sessions.data) {
      if (session.metadata?.stayflow_payment_id === input.paymentId) {
        await stripe.checkout.sessions.expire(session.id, {}, options);
      }
    }
  }

  if (input.previousIntentId && input.previousIntentId !== input.paidIntentId) {
    const previous = await stripe.paymentIntents.retrieve(input.previousIntentId, {}, options);
    if (previous.status !== "succeeded" && previous.status !== "canceled") {
      // O saldo já aplicado volta para o cliente.
      await stripe.paymentIntents.cancel(previous.id, {}, options);
    }
  }
}

/** Dinheiro recebido para um pagamento que já estava pago (ou cancelado): devolve-o. */
export async function refundDuplicatePayment(stripe: Stripe, accountId: string, paymentIntentId: string) {
  await stripe.refunds.create(
    { payment_intent: paymentIntentId, reason: "duplicate" },
    { stripeAccount: accountId, idempotencyKey: `stayflow-refund-${paymentIntentId}` },
  );
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

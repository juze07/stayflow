import "server-only";
import { createAnonClient } from "@/lib/supabase/anon";
import type { VirtualIban } from "./schemas";

export type StayContext = {
  stayId: string;
  businessId: string;
  accountId: string | null;
  chargesEnabled: boolean;
  customerId: string | null;
  iban: string | null;
  guestName: string;
  guestEmail: string;
};

export type PaymentContext = {
  paymentId: string;
  stayId: string | null;
  businessId: string;
  description: string;
  amountCents: number;
  status: string;
  paymentIntentId: string | null;
};

export type PendingPayment = {
  paymentId: string;
  stayId: string;
  businessId: string;
  description: string;
  amountCents: number;
  paymentIntentId: string | null;
};

export type MarkPaidResult = "paid" | "already_paid" | "not_pending" | "amount_mismatch" | "not_found";

/**
 * Escritas e leituras feitas em nome da Stripe (sem sessão de utilizador).
 * Cada função da base de dados exige o segredo partilhado.
 */
export type StripeDb = {
  saveAccount(businessId: string, accountId: string): Promise<string>;
  updateAccount(accountId: string, chargesEnabled: boolean, detailsSubmitted: boolean): Promise<void>;
  stayContext(stayId: string): Promise<StayContext | null>;
  paymentContext(paymentId: string): Promise<PaymentContext | null>;
  saveStayCustomer(stayId: string, customerId: string): Promise<string>;
  saveStayIban(stayId: string, iban: VirtualIban): Promise<void>;
  attachPaymentIntent(paymentId: string, paymentIntentId: string): Promise<void>;
  pendingPaymentsForCustomer(accountId: string, customerId: string): Promise<PendingPayment[]>;
  markPaymentPaid(input: {
    accountId: string;
    paymentId: string;
    paymentIntentId: string;
    amountCents: number;
    method: "card" | "transfer";
  }): Promise<MarkPaidResult>;
  eventProcessed(eventId: string): Promise<boolean>;
  recordEvent(eventId: string, type: string): Promise<void>;
};

export function createStripeDb(secret: string): StripeDb {
  const supabase = createAnonClient();
  const s = { p_secret: secret };

  return {
    async saveAccount(businessId, accountId) {
      const { data, error } = await supabase.rpc("stripe_save_account", {
        ...s,
        p_business_id: businessId,
        p_account_id: accountId,
      });
      if (error) throw error;
      return data;
    },
    async updateAccount(accountId, chargesEnabled, detailsSubmitted) {
      const { error } = await supabase.rpc("stripe_update_account", {
        ...s,
        p_account_id: accountId,
        p_charges_enabled: chargesEnabled,
        p_details_submitted: detailsSubmitted,
      });
      if (error) throw error;
    },
    async stayContext(stayId) {
      const { data, error } = await supabase.rpc("stripe_stay_context", { ...s, p_stay_id: stayId });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        stayId: row.stay_id,
        businessId: row.business_id,
        accountId: row.account_id,
        chargesEnabled: row.charges_enabled,
        customerId: row.customer_id,
        iban: row.iban,
        guestName: row.guest_name,
        guestEmail: row.guest_email,
      };
    },
    async paymentContext(paymentId) {
      const { data, error } = await supabase.rpc("stripe_payment_context", { ...s, p_payment_id: paymentId });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        paymentId: row.payment_id,
        stayId: row.stay_id,
        businessId: row.business_id,
        description: row.description,
        amountCents: row.amount_cents,
        status: row.status,
        paymentIntentId: row.payment_intent_id,
      };
    },
    async saveStayCustomer(stayId, customerId) {
      const { data, error } = await supabase.rpc("stripe_save_stay_customer", {
        ...s,
        p_stay_id: stayId,
        p_customer_id: customerId,
      });
      if (error) throw error;
      return data;
    },
    async saveStayIban(stayId, iban) {
      const { error } = await supabase.rpc("stripe_save_stay_iban", {
        ...s,
        p_stay_id: stayId,
        p_iban: iban.iban,
        p_bic: iban.bic ?? "",
        p_bank_name: iban.bankName ?? "",
        p_account_holder_name: iban.accountHolderName ?? "",
        p_country: iban.country,
      });
      if (error) throw error;
    },
    async attachPaymentIntent(paymentId, paymentIntentId) {
      const { error } = await supabase.rpc("stripe_attach_payment_intent", {
        ...s,
        p_payment_id: paymentId,
        p_payment_intent_id: paymentIntentId,
      });
      if (error) throw error;
    },
    async pendingPaymentsForCustomer(accountId, customerId) {
      const { data, error } = await supabase.rpc("stripe_pending_payments_for_customer", {
        ...s,
        p_account_id: accountId,
        p_customer_id: customerId,
      });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        paymentId: row.payment_id,
        stayId: row.stay_id,
        businessId: row.business_id,
        description: row.description,
        amountCents: row.amount_cents,
        paymentIntentId: row.payment_intent_id,
      }));
    },
    async markPaymentPaid({ accountId, paymentId, paymentIntentId, amountCents, method }) {
      const { data, error } = await supabase.rpc("stripe_mark_payment_paid", {
        ...s,
        p_account_id: accountId,
        p_payment_id: paymentId,
        p_payment_intent_id: paymentIntentId,
        p_amount_cents: amountCents,
        p_method: method,
      });
      if (error) throw error;
      return data as MarkPaidResult;
    },
    async eventProcessed(eventId) {
      const { data, error } = await supabase.rpc("stripe_event_processed", { ...s, p_event_id: eventId });
      if (error) throw error;
      return data;
    },
    async recordEvent(eventId, type) {
      const { error } = await supabase.rpc("stripe_record_event", { ...s, p_event_id: eventId, p_type: type });
      if (error) throw error;
    },
  };
}

import "server-only";
import { createClient } from "@/lib/supabase/server";

export type StripeAccountStatus = {
  accountId: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
};

export async function getStripeAccount(businessId: string): Promise<StripeAccountStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stripe_accounts")
    .select("account_id, charges_enabled, details_submitted")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    accountId: data.account_id,
    chargesEnabled: data.charges_enabled,
    detailsSubmitted: data.details_submitted,
  };
}

export type TenantPaymentOptions = {
  stayId: string;
  onlinePayments: boolean;
  iban: { iban: string; bic: string | null; bankName: string | null; accountHolderName: string | null } | null;
};

export async function getMyPaymentOptions(): Promise<TenantPaymentOptions[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_stay_payment_options");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    stayId: row.stay_id,
    onlinePayments: row.online_payments,
    iban: row.iban
      ? { iban: row.iban, bic: row.bic, bankName: row.bank_name, accountHolderName: row.account_holder_name }
      : null,
  }));
}

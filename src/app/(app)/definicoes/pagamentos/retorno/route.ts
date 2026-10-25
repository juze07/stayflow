import { redirect } from "next/navigation";
import { getStripe, getStripeEnv } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/modules/business/queries";
import { createStripeDb } from "@/modules/stripe/db";
import { syncAccountStatus } from "@/modules/stripe/service";

/** Regresso da verificação na Stripe: atualiza o estado da conta e volta às definições. */
export async function GET() {
  const { business } = await requireBusiness();
  const env = getStripeEnv();
  if (env) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("stripe_accounts")
        .select("account_id")
        .eq("business_id", business.id)
        .maybeSingle();
      if (data) await syncAccountStatus(getStripe(), createStripeDb(env.STRIPE_DB_SECRET), data.account_id);
    } catch (error) {
      console.error("stripe return sync failed", error);
    }
  }
  redirect("/definicoes/pagamentos?stripe=retorno");
}

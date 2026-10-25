"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, success, type ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/lib/env";
import { getStripe, getStripeEnv } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness, requireSession } from "@/modules/business/queries";
import { canManageBusiness } from "@/modules/business/roles";
import { idSchema } from "@/modules/business/schemas";
import { STRIPE_ACCOUNT_COUNTRY } from "./constants";
import { createStripeDb } from "./db";
import { createCardCheckout, ensureStayIban } from "./service";

const NOT_CONFIGURED = "Os pagamentos online ainda não estão configurados nesta aplicação.";
const NOT_AVAILABLE = "Esta empresa ainda não aceita pagamentos online.";

/**
 * Liga (ou continua a ligar) a conta Stripe da empresa e abre a verificação
 * da Stripe. Só administradores.
 */
export async function connectStripeAccountAction(): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageBusiness(role)) return failure("Só um administrador pode ligar a conta Stripe.");
  const env = getStripeEnv();
  if (!env) return failure(NOT_CONFIGURED);

  let url: string;
  try {
    const stripe = getStripe();
    const db = createStripeDb(env.STRIPE_DB_SECRET);
    const supabase = await createClient();
    const { data: existing, error } = await supabase
      .from("stripe_accounts")
      .select("account_id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (error) throw error;

    let accountId = existing?.account_id;
    if (!accountId) {
      // Conta "standard": a empresa tem o seu próprio painel Stripe, paga as
      // comissões e responde por reembolsos e disputas.
      const account = await stripe.accounts.create(
        {
          country: STRIPE_ACCOUNT_COUNTRY,
          business_profile: { name: business.name },
          controller: {
            stripe_dashboard: { type: "full" },
            fees: { payer: "account" },
            losses: { payments: "stripe" },
            requirement_collection: "stripe",
          },
          capabilities: {
            card_payments: { requested: true },
            bank_transfer_payments: { requested: true },
          },
          metadata: { stayflow_business_id: business.id },
        },
        { idempotencyKey: `stayflow-account-${business.id}` },
      );
      accountId = await db.saveAccount(business.id, account.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: siteUrl("/definicoes/pagamentos?stripe=renovar"),
      return_url: siteUrl("/definicoes/pagamentos?stripe=retorno"),
    });
    url = link.url;
  } catch (error) {
    console.error("stripe connect failed", error);
    return failure(GENERIC_ERROR);
  }

  redirect(url);
}

/** Atualiza o estado da conta ligada (também chega pelo webhook). */
export async function refreshStripeAccountAction(): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageBusiness(role)) return failure("Só um administrador pode fazer isto.");
  const env = getStripeEnv();
  if (!env) return failure(NOT_CONFIGURED);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stripe_accounts")
      .select("account_id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return failure("Ainda não ligou uma conta Stripe.");

    const account = await getStripe().accounts.retrieve(data.account_id);
    await createStripeDb(env.STRIPE_DB_SECRET).updateAccount(
      account.id,
      account.charges_enabled ?? false,
      account.details_submitted ?? false,
    );
  } catch (error) {
    console.error("stripe refresh failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/pagamentos");
  return success(undefined, "Estado atualizado.");
}

/** Mostra (e cria na primeira vez) o IBAN só deste inquilino para esta estadia. */
export async function showMyIbanAction(stayId: string): Promise<ActionResult> {
  await requireSession();
  const id = idSchema.safeParse(stayId);
  if (!id.success) return failure("Estadia não encontrada.");
  const env = getStripeEnv();
  if (!env) return failure(NOT_CONFIGURED);

  try {
    // A sessão do inquilino confirma que a estadia é dele.
    const supabase = await createClient();
    const { data: options, error } = await supabase.rpc("my_stay_payment_options");
    if (error) throw error;
    const option = options?.find((row) => row.stay_id === id.data);
    if (!option) return failure("Estadia não encontrada.");
    if (!option.online_payments) return failure(NOT_AVAILABLE);

    const db = createStripeDb(env.STRIPE_DB_SECRET);
    const stay = await db.stayContext(id.data);
    if (!stay?.accountId || !stay.chargesEnabled) return failure(NOT_AVAILABLE);
    if (!stay.iban) await ensureStayIban(getStripe(), db, { ...stay, accountId: stay.accountId });
  } catch (error) {
    console.error("stripe iban failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/inquilino");
  return success();
}

/** Abre a página segura da Stripe para pagar por cartão. */
export async function payByCardAction(paymentId: string): Promise<ActionResult> {
  await requireSession();
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return failure("Pagamento não encontrado.");
  const env = getStripeEnv();
  if (!env) return failure(NOT_CONFIGURED);

  let url: string;
  try {
    const supabase = await createClient();
    const { data: payments, error } = await supabase.rpc("my_stay_payments");
    if (error) throw error;
    const mine = payments?.find((row) => row.payment_id === id.data);
    if (!mine || mine.status !== "pending") return failure("Este pagamento já não está por pagar.");

    const db = createStripeDb(env.STRIPE_DB_SECRET);
    const [payment, stay] = await Promise.all([db.paymentContext(id.data), db.stayContext(mine.stay_id)]);
    if (!payment || payment.status !== "pending") return failure("Este pagamento já não está por pagar.");
    if (!stay?.accountId || !stay.chargesEnabled) return failure(NOT_AVAILABLE);

    url = await createCardCheckout(getStripe(), db, { ...stay, accountId: stay.accountId }, payment, {
      success: siteUrl("/inquilino?pagamento=concluido"),
      cancel: siteUrl("/inquilino"),
    });
  } catch (error) {
    console.error("stripe checkout failed", error);
    return failure(GENERIC_ERROR);
  }

  redirect(url);
}

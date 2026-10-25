import "server-only";
import Stripe from "stripe";
import { z } from "zod";

/**
 * Configuração da Stripe, só no servidor. As chaves vivem nas variáveis de
 * ambiente da Vercel/GitHub e nunca chegam ao browser.
 */
const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().regex(/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_[A-Za-z0-9]+$/),
  // Segredo partilhado com a base de dados (ver migração stripe_payments).
  STRIPE_DB_SECRET: z.string().min(32),
});

export type StripeEnv = z.infer<typeof stripeEnvSchema>;

export function getStripeEnv(): StripeEnv | null {
  const parsed = stripeEnvSchema.safeParse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_DB_SECRET: process.env.STRIPE_DB_SECRET,
  });
  return parsed.success ? parsed.data : null;
}

export function isStripeConfigured(): boolean {
  return getStripeEnv() !== null;
}

let client: Stripe | undefined;

export function getStripe(): Stripe {
  const env = getStripeEnv();
  if (!env)
    throw new Error("Stripe não configurada: faltam STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET ou STRIPE_DB_SECRET.");
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: "StayFlow" },
    maxNetworkRetries: 2,
  });
  return client;
}

import { getStripe, getStripeEnv } from "@/lib/stripe";
import { createStripeDb } from "@/modules/stripe/db";
import { handleStripeEvent } from "@/modules/stripe/webhook";

/**
 * Webhook da Stripe (eventos das contas ligadas). A assinatura é sempre
 * verificada com o corpo original do pedido antes de qualquer escrita.
 */
export async function POST(request: Request) {
  const env = getStripeEnv();
  if (!env) return new Response("Stripe não configurada", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Assinatura em falta", { status: 400 });

  const stripe = getStripe();
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event, { stripe, db: createStripeDb(env.STRIPE_DB_SECRET) });
    return Response.json({ received: true, outcome });
  } catch (error) {
    // 500: a Stripe volta a enviar o evento mais tarde.
    console.error("stripe webhook failed", { event: event.id, type: event.type, error });
    return new Response("Erro ao processar", { status: 500 });
  }
}

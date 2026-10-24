import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Cliente sem sessão (papel `anon`), para pedidos que não vêm de um utilizador,
 * como o webhook da Stripe. Só consegue chamar funções que o permitem
 * explicitamente; nunca usa `service_role`.
 */
export function createAnonClient() {
  const env = getPublicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

import { writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD, STATE_FILE, requireEnv, signedInClient, type E2EState } from "./fixtures";

// Cria duas empresas isoladas com utilizadores novos (emails únicos, não precisa de limpar a BD).
export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  const admin = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("E2E_SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });
  const stamp = Date.now();

  async function createOwner(name: string, businessName: string) {
    const email = `${name}.${stamp}@exemplo.pt`;
    const { error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) throw error;
    const client = await signedInClient(email);
    const { data: businessId, error: rpcError } = await client.rpc("create_business", { p_name: businessName });
    if (rpcError) throw rpcError;
    return { email, client, businessId: businessId as string };
  }

  const ana = await createOwner("ana", "Lisboa Stays");
  const bruno = await createOwner("bruno", "Porto Flats");

  const { data: property, error } = await ana.client
    .from("properties")
    .insert({
      business_id: ana.businessId,
      name: "Apartamento Alfama",
      address_line: "Rua dos Remédios 10",
      postal_code: "1100-441",
      city: "Lisboa",
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
    })
    .select("id")
    .single();
  if (error) throw error;

  const state: E2EState = {
    admin: { email: ana.email, businessId: ana.businessId, propertyId: property.id },
    other: { email: bruno.email, businessId: bruno.businessId },
  };
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

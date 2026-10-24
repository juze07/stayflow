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

  // Inquilino com estadia a decorrer e uma renda por pagar.
  const tenantEmail = `carla.${stamp}@exemplo.pt`;
  const { error: tenantError } = await admin.auth.admin.createUser({
    email: tenantEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Carla" },
  });
  if (tenantError) throw tenantError;
  const today = new Date().toISOString().slice(0, 10);
  const { data: stay, error: stayError } = await ana.client
    .from("stays")
    .insert({
      business_id: ana.businessId,
      property_id: property.id,
      guest_name: "Carla",
      guest_email: tenantEmail,
      starts_on: today,
    })
    .select("id, invite_token")
    .single();
  if (stayError) throw stayError;
  const { error: paymentError } = await ana.client.from("payments").insert({
    business_id: ana.businessId,
    property_id: property.id,
    stay_id: stay.id,
    description: "Renda",
    amount_cents: 65000,
    due_on: today,
  });
  if (paymentError) throw paymentError;
  const tenant = await signedInClient(tenantEmail);
  const { error: acceptError } = await tenant.rpc("accept_stay_invitation", { p_token: stay.invite_token });
  if (acceptError) throw acceptError;

  const state: E2EState = {
    admin: { email: ana.email, businessId: ana.businessId, propertyId: property.id },
    other: { email: bruno.email, businessId: bruno.businessId },
    tenant: { email: tenantEmail, stayId: stay.id },
  };
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

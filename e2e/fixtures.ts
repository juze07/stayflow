import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const STATE_FILE = "e2e/.state.json";
export const PASSWORD = "Teste12345";

export type E2EState = {
  admin: { email: string; businessId: string; propertyId: string };
  other: { email: string; businessId: string };
  tenant: { email: string; stayId: string };
};

export function readState(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as E2EState;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta a variável ${name} para os testes e2e.`);
  return value;
}

export function publicClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false },
  });
}

export async function signedInClient(email: string) {
  const client = publicClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

export async function signInWithUi(page: Page, email: string) {
  await page.goto("/entrar");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/);
}

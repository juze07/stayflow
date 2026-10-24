import { expect, test } from "@playwright/test";
import { PASSWORD, readState, signedInClient } from "./fixtures";

test("o inquilino vê a estadia, avisa que pagou e reporta um problema", async ({ page }) => {
  const { admin, tenant } = readState();
  const project = test.info().project.name;
  const company = await signedInClient(admin.email);
  const description = `Limpeza final ${project}`;
  const { error: paymentError } = await company.from("payments").insert({
    business_id: admin.businessId,
    property_id: admin.propertyId,
    stay_id: tenant.stayId,
    description,
    amount_cents: 4000,
    due_on: new Date().toISOString().slice(0, 10),
  });
  expect(paymentError).toBeNull();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // Sem empresa, o inquilino é encaminhado para o seu portal.
  await page.goto("/entrar");
  await page.locator('input[type="email"]').fill(tenant.email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/inquilino/);

  await expect(page.getByRole("heading", { name: "Apartamento Alfama" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "scroll horizontal").toBeLessThanOrEqual(0);

  const row = page.getByRole("listitem").filter({ hasText: description });
  await row.getByRole("button", { name: "Já paguei" }).click();
  await row.getByRole("button", { name: "Avisar a empresa" }).click();
  await expect(row.getByText("A aguardar confirmação")).toBeVisible();

  const title = `Torneira a pingar ${project}`;
  await page.getByLabel("O que se passa?").fill(title);
  await page.getByRole("button", { name: "Enviar à empresa" }).click();
  await expect(page.getByText("A empresa foi avisada")).toBeVisible();
  expect(errors).toEqual([]);

  // O pagamento fica assinalado e o problema chega à Manutenção, ligado à estadia.
  const { data: payment } = await company.from("payments").select("tenant_reported_at").eq("description", description);
  expect(payment?.[0]?.tenant_reported_at).not.toBeNull();
  const { data } = await company
    .from("maintenance_issues")
    .select("stay_id")
    .eq("business_id", admin.businessId)
    .eq("title", title);
  expect(data).toEqual([{ stay_id: tenant.stayId }]);
});

test("o inquilino não lê os dados da empresa (API pública)", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "computador", "Não depende do ecrã");
  const { admin, tenant } = readState();
  const client = await signedInClient(tenant.email);

  for (const table of ["properties", "stays", "payments", "maintenance_issues", "expenses"] as const) {
    const { data } = await client.from(table).select("id").eq("business_id", admin.businessId);
    expect(data, table).toEqual([]);
  }
  const { data: stays } = await client.rpc("my_stays");
  expect(stays?.map((s: { stay_id: string }) => s.stay_id)).toEqual([tenant.stayId]);
});

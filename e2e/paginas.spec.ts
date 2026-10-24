import { expect, test } from "@playwright/test";
import { readState, signInWithUi } from "./fixtures";

// Cada página privada abre sem erros, com título e sem scroll horizontal (telemóvel e computador).
test("páginas privadas abrem sem erros", async ({ page }) => {
  const { admin, tenant } = readState();
  const routes = [
    "/dashboard",
    "/propriedades",
    `/propriedades/${admin.propertyId}`,
    "/propriedades/nova",
    "/tarefas",
    "/tarefas/nova",
    "/limpezas",
    "/inspecoes",
    "/manutencao",
    "/manutencao/novo",
    "/despesas",
    "/despesas/nova",
    "/despesas/relatorio",
    "/estadias",
    "/estadias/nova",
    `/estadias/${tenant.stayId}`,
    "/receitas",
    "/receitas/pagamentos",
    "/receitas/novo",
    "/definicoes/empresa",
    "/definicoes/equipa",
    "/definicoes/listas",
  ];

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await signInWithUi(page, admin.email);

  for (const route of routes) {
    await test.step(route, async () => {
      errors.length = 0;
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "scroll horizontal").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test("rota inexistente mostra 404 em português", async ({ page }) => {
  await signInWithUi(page, readState().admin.email);
  const response = await page.goto("/rota-inexistente");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

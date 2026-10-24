import { defineConfig, devices } from "@playwright/test";

// Testes ponta a ponta contra o build de produção (`npm run build` antes) e o Supabase local.
// Variáveis: as mesmas do .env.local + E2E_SUPABASE_SECRET_KEY (só para criar utilizadores de teste).
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "pt-PT",
    timezoneId: "Europe/Lisbon",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "telemovel", use: { ...devices["Pixel 7"] } },
    { name: "computador", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/entrar",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

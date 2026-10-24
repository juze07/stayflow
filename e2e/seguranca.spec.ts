import { expect, test } from "@playwright/test";
import { publicClient, readState, signedInClient } from "./fixtures";

// Testes sem browser: correm uma vez só.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "computador", "Não depende do ecrã");
});

test("uma empresa não lê nem altera dados de outra (API pública)", async () => {
  const { admin, other } = readState();
  const intruder = await signedInClient(other.email);

  const { data: visible } = await intruder.from("properties").select("id").eq("business_id", admin.businessId);
  expect(visible).toEqual([]);

  const { error: insertError } = await intruder.from("properties").insert({
    business_id: admin.businessId,
    name: "Intrusa",
    address_line: "Rua X",
    postal_code: "1000-000",
    city: "Lisboa",
  });
  expect(insertError).not.toBeNull();

  const { error: uploadError } = await intruder.storage
    .from("attachments")
    .upload(`${admin.businessId}/properties/${admin.propertyId}/intruso.jpg`, new Blob(["x"]), {
      contentType: "image/jpeg",
    });
  expect(uploadError).not.toBeNull();
});

test("visitantes sem sessão não leem dados", async () => {
  const { data, error } = await publicClient().from("properties").select("id");
  expect(data ?? []).toEqual([]);
  expect(error).not.toBeNull();
});

test("área privada exige sessão", async ({ request }) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toContain("/entrar?next=%2Fdashboard");
});

test("cabeçalhos de segurança", async ({ request }) => {
  const headers = (await request.get("/entrar")).headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-powered-by"]).toBeUndefined();
});

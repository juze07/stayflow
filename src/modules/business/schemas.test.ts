import { describe, expect, it } from "vitest";
import { businessSettingsSchema, createBusinessSchema, inviteMemberSchema } from "./schemas";

const validSettings = {
  name: "Lisboa Stays",
  taxId: "",
  email: "",
  phone: "",
  addressLine: "",
  postalCode: "",
  city: "",
  timezone: "Europe/Lisbon",
};

describe("createBusinessSchema", () => {
  it("remove espaços e exige 2 caracteres", () => {
    expect(createBusinessSchema.parse({ name: "  Casa Azul  " }).name).toBe("Casa Azul");
    expect(createBusinessSchema.safeParse({ name: " a " }).success).toBe(false);
  });
});

describe("businessSettingsSchema", () => {
  it("converte campos opcionais vazios em null", () => {
    const parsed = businessSettingsSchema.parse(validSettings);
    expect(parsed.taxId).toBeNull();
    expect(parsed.email).toBeNull();
    expect(parsed.postalCode).toBeNull();
  });

  it("valida o código postal português e o NIF", () => {
    expect(businessSettingsSchema.safeParse({ ...validSettings, postalCode: "1100-001" }).success).toBe(true);
    expect(businessSettingsSchema.safeParse({ ...validSettings, postalCode: "1100" }).success).toBe(false);
    expect(businessSettingsSchema.safeParse({ ...validSettings, taxId: "123" }).success).toBe(false);
  });

  it("só aceita fusos horários da lista", () => {
    expect(businessSettingsSchema.safeParse({ ...validSettings, timezone: "Mars/Olympus" }).success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("normaliza o email para minúsculas", () => {
    expect(inviteMemberSchema.parse({ email: " Ana@Example.COM ", role: "staff" }).email).toBe("ana@example.com");
  });

  it("rejeita funções desconhecidas", () => {
    expect(inviteMemberSchema.safeParse({ email: "ana@example.com", role: "owner" }).success).toBe(false);
  });
});

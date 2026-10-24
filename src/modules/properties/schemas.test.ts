import { describe, expect, it } from "vitest";
import { propertySchema } from "./schemas";

const valid = {
  name: "T2 Alfama",
  addressLine: "Rua dos Remédios, 10",
  postalCode: "1100-445",
  city: "Lisboa",
  bedrooms: 2,
  bathrooms: 1,
  maxGuests: 4,
  accessInstructions: "",
  internalNotes: "  ",
};

describe("propertySchema", () => {
  it("aceita uma propriedade válida e converte notas vazias em null", () => {
    const parsed = propertySchema.parse(valid);
    expect(parsed.accessInstructions).toBeNull();
    expect(parsed.internalNotes).toBeNull();
  });

  it("exige o código postal português", () => {
    const result = propertySchema.safeParse({ ...valid, postalCode: "1100" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Use o formato 0000-000.");
  });

  it("rejeita números fora dos limites e campos vazios", () => {
    expect(propertySchema.safeParse({ ...valid, maxGuests: 0 }).success).toBe(false);
    expect(propertySchema.safeParse({ ...valid, bedrooms: 1.5 }).success).toBe(false);
    expect(propertySchema.safeParse({ ...valid, bedrooms: Number.NaN }).success).toBe(false);
    expect(propertySchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

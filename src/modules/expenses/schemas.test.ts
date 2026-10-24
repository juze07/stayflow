import { describe, expect, it } from "vitest";
import { expenseSchema } from "./schemas";

const valid = {
  description: "Detergentes",
  category: "supplies",
  amount: "12,50",
  incurredOn: "2026-10-20",
  propertyId: "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b",
  maintenanceIssueId: "",
  supplier: "",
  notes: "",
} as const;

describe("expenseSchema", () => {
  it("converte o valor para cêntimos e normaliza opcionais", () => {
    const parsed = expenseSchema.parse(valid);
    expect(parsed.amount).toBe(1250);
    expect(parsed.maintenanceIssueId).toBeNull();
    expect(parsed.supplier).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("aceita despesas gerais, sem propriedade", () => {
    expect(expenseSchema.parse({ ...valid, propertyId: "" }).propertyId).toBeNull();
  });

  it("exige valor positivo, data válida e descrição", () => {
    expect(expenseSchema.safeParse({ ...valid, amount: "" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, amount: "-3" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, amount: "1000000" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, incurredOn: "2026-02-30" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, description: "  " }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, category: "travel" }).success).toBe(false);
  });
});

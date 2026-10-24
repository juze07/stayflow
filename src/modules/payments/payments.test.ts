import { describe, expect, it } from "vitest";
import { summarizeRevenue } from "./report";
import { markPaidSchema, paymentSchema } from "./schemas";

const valid = {
  description: "Renda de novembro",
  amount: "650,00",
  dueOn: "2026-11-01",
  propertyId: "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b",
  stayId: "",
  paid: false,
  paidOn: "",
  method: "",
  notes: "",
};

describe("paymentSchema", () => {
  it("converte o valor para cêntimos e normaliza opcionais", () => {
    const parsed = paymentSchema.parse(valid);
    expect(parsed.amount).toBe(65000);
    expect(parsed.stayId).toBeNull();
    expect(parsed.method).toBeNull();
    expect(parsed.paidOn).toBeNull();
  });

  it("um pagamento recebido exige a data de recebimento", () => {
    expect(paymentSchema.safeParse({ ...valid, paid: true }).success).toBe(false);
    const parsed = paymentSchema.parse({ ...valid, paid: true, paidOn: "2026-11-02", method: "mbway" });
    expect(parsed.method).toBe("mbway");
  });

  it("recusa valores inválidos e métodos desconhecidos", () => {
    expect(paymentSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...valid, amount: "abc" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...valid, method: "bitcoin" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...valid, propertyId: "" }).success).toBe(false);
  });
});

describe("markPaidSchema", () => {
  it("exige data e método", () => {
    expect(markPaidSchema.safeParse({ paidOn: "2026-11-02", method: "cash" }).success).toBe(true);
    expect(markPaidSchema.safeParse({ paidOn: "", method: "cash" }).success).toBe(false);
  });
});

describe("summarizeRevenue", () => {
  const rows = [
    { month: "2026-09-01", propertyId: "a", revenueCents: 100_000, expenseCents: 20_000 },
    { month: "2026-09-01", propertyId: null, revenueCents: 0, expenseCents: 5_000 },
    { month: "2026-11-01", propertyId: "b", revenueCents: 30_000, expenseCents: 40_000 },
  ];

  it("soma receitas, despesas, resultado e margem", () => {
    const summary = summarizeRevenue(rows, { from: "2026-09-01", to: "2026-11-30" });
    expect(summary.revenueCents).toBe(130_000);
    expect(summary.expenseCents).toBe(65_000);
    expect(summary.profitCents).toBe(65_000);
    expect(summary.marginPercent).toBe(50);
  });

  it("inclui meses sem movimentos e ordena propriedades pelo resultado", () => {
    const summary = summarizeRevenue(rows, { from: "2026-09-01", to: "2026-11-30" });
    expect(summary.byMonth.map((m) => m.key)).toEqual(["2026-09-01", "2026-10-01", "2026-11-01"]);
    expect(summary.byMonth[1]).toMatchObject({ revenueCents: 0, expenseCents: 0, profitCents: 0 });
    expect(summary.byProperty.map((p) => p.key)).toEqual(["a", null, "b"]);
    expect(summary.byProperty[2].profitCents).toBe(-10_000);
  });

  it("sem receitas não há margem", () => {
    expect(summarizeRevenue([], { from: "2026-09-01", to: "2026-09-30" }).marginPercent).toBeNull();
  });
});

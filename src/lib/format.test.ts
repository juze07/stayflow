import { describe, expect, it } from "vitest";
import { firstName, formatCurrency, formatDate, formatDateTime, initials, parseCurrencyToCents } from "./format";

const nbsp = (value: string) => value.replace(/[  ]/g, " ");

describe("formatCurrency", () => {
  it("apresenta cêntimos em euros, no formato português", () => {
    expect(nbsp(formatCurrency(123450))).toBe("1234,50 €");
    expect(nbsp(formatCurrency(5))).toBe("0,05 €");
  });
});

describe("parseCurrencyToCents", () => {
  it.each([
    ["12,50", 1250],
    ["12.5", 1250],
    ["1 234,56", 123456],
    ["1.234,56", 123456],
    ["€ 7", 700],
  ])("converte %s em %i cêntimos", (input, expected) => {
    expect(parseCurrencyToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "-3"])("rejeita %s", (input) => {
    expect(parseCurrencyToCents(input)).toBeNull();
  });
});

describe("datas", () => {
  it("usa dd/mm/aaaa e 24 horas no fuso de Lisboa", () => {
    const instant = new Date("2026-07-15T21:30:00Z");
    expect(formatDate(instant)).toBe("15/07/2026");
    expect(formatDateTime(instant)).toBe("15/07/2026 22:30");
  });

  it("respeita o fuso horário da empresa", () => {
    const instant = new Date("2026-07-15T23:30:00Z");
    expect(formatDate(instant, "Europe/Lisbon")).toBe("16/07/2026");
    expect(formatDate(instant, "Atlantic/Azores")).toBe("15/07/2026");
  });
});

describe("nomes", () => {
  it("devolve o primeiro nome ou o início do email", () => {
    expect(firstName("Ana Maria Sousa")).toBe("Ana");
    expect(firstName("", "joao@example.com")).toBe("joao");
  });

  it("gera iniciais", () => {
    expect(initials("Ana Maria Sousa")).toBe("AS");
    expect(initials(null, "joao@example.com")).toBe("JO");
  });
});

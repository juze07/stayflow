import { describe, expect, it } from "vitest";
import { dayRange } from "./dates";

describe("dayRange", () => {
  it("calcula o dia em Lisboa no verão (UTC+1)", () => {
    const { start, end } = dayRange(new Date("2026-07-15T12:00:00Z"), "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-07-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-15T23:00:00.000Z");
  });

  it("considera o dia seguinte depois da meia-noite local", () => {
    const { start } = dayRange(new Date("2026-07-15T23:30:00Z"), "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-07-15T23:00:00.000Z");
  });

  it("lida com a mudança para a hora de verão (dia de 23 horas)", () => {
    const { start, end } = dayRange(new Date("2026-03-29T12:00:00Z"), "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-03-29T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-29T23:00:00.000Z");
  });

  it("lida com a mudança para a hora de inverno (dia de 25 horas)", () => {
    const { start, end } = dayRange(new Date("2026-10-25T12:00:00Z"), "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-10-24T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });

  it("funciona nos Açores (UTC-1)", () => {
    const { start } = dayRange(new Date("2026-01-10T00:30:00Z"), "Atlantic/Azores");
    expect(start.toISOString()).toBe("2026-01-09T01:00:00.000Z");
  });
});

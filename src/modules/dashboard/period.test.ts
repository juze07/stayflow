import { describe, expect, it } from "vitest";
import { periodRange } from "./period";

// 23:30 UTC de 24/10 já é dia 25 em Lisboa (UTC+1), mas ainda dia 24 nos Açores (UTC-1).
const now = new Date("2026-10-24T23:30:00Z");

describe("periodRange", () => {
  it("termina hoje no fuso da empresa", () => {
    expect(periodRange("7d", "Europe/Lisbon", now)).toEqual({ from: "2026-10-19", to: "2026-10-25" });
    expect(periodRange("7d", "Atlantic/Azores", now)).toEqual({ from: "2026-10-18", to: "2026-10-24" });
  });

  it("calcula 30 dias e o mês corrente", () => {
    expect(periodRange("30d", "Europe/Lisbon", now)).toEqual({ from: "2026-09-26", to: "2026-10-25" });
    expect(periodRange("mes", "Europe/Lisbon", now)).toEqual({ from: "2026-10-01", to: "2026-10-25" });
  });
});

import { describe, expect, it } from "vitest";
import { monthsInRange, resolveReportRange, summarizeReport, type ReportRow } from "./report";

const now = new Date("2026-03-15T12:00:00Z");
const tz = "Europe/Lisbon";

describe("resolveReportRange", () => {
  it("calcula os períodos rápidos no fuso da empresa", () => {
    expect(resolveReportRange("mes", {}, tz, now)).toMatchObject({ from: "2026-03-01", to: "2026-03-15" });
    expect(resolveReportRange("mes-anterior", {}, tz, now)).toMatchObject({ from: "2026-02-01", to: "2026-02-28" });
    expect(resolveReportRange("ano", {}, tz, now)).toMatchObject({ from: "2026-01-01", to: "2026-03-15" });
    expect(resolveReportRange("12m", {}, tz, now)).toMatchObject({ from: "2025-04-01", to: "2026-03-15" });
  });

  it("mês passado em janeiro é dezembro do ano anterior", () => {
    const january = new Date("2026-01-10T12:00:00Z");
    expect(resolveReportRange("mes-anterior", {}, tz, january)).toMatchObject({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("aceita datas personalizadas válidas e ignora as inválidas", () => {
    expect(resolveReportRange("personalizado", { from: "2026-01-05", to: "2026-02-10" }, tz, now)).toEqual({
      period: "personalizado",
      from: "2026-01-05",
      to: "2026-02-10",
    });
    expect(resolveReportRange("personalizado", { from: "2026-02-10", to: "2026-01-05" }, tz, now).period).toBe("mes");
    expect(resolveReportRange("personalizado", { from: "2020-01-01", to: "2026-01-05" }, tz, now).period).toBe("mes");
    expect(resolveReportRange("personalizado", { from: "2026-02-30", to: "2026-03-01" }, tz, now).period).toBe("mes");
  });
});

describe("monthsInRange", () => {
  it("inclui todos os meses, mesmo a mudar de ano", () => {
    expect(monthsInRange("2025-11-20", "2026-02-03")).toEqual(["2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01"]);
    expect(monthsInRange("2026-03-01", "2026-03-15")).toEqual(["2026-03-01"]);
  });
});

describe("summarizeReport", () => {
  const rows: ReportRow[] = [
    { month: "2026-01-01", propertyId: "a", category: "cleaning", totalCents: 1000, count: 2 },
    { month: "2026-01-01", propertyId: "b", category: "supplies", totalCents: 500, count: 1 },
    { month: "2026-03-01", propertyId: "a", category: "supplies", totalCents: 2500, count: 1 },
    { month: "2026-03-01", propertyId: null, category: "other", totalCents: 300, count: 1 },
  ];

  it("soma por período, propriedade e categoria", () => {
    const report = summarizeReport(rows, { from: "2026-01-01", to: "2026-03-31" });
    expect(report.totalCents).toBe(4300);
    expect(report.count).toBe(5);
    expect(report.byMonth.map((m) => [m.key, m.totalCents])).toEqual([
      ["2026-01-01", 1500],
      ["2026-02-01", 0],
      ["2026-03-01", 2800],
    ]);
    expect(report.byProperty.map((p) => [p.key, p.totalCents])).toEqual([
      ["a", 3500],
      ["b", 500],
      [null, 300],
    ]);
    expect(report.byCategory[0]).toEqual({ key: "supplies", totalCents: 3000, count: 2 });
  });

  it("devolve zeros quando não há despesas", () => {
    const report = summarizeReport([], { from: "2026-01-01", to: "2026-01-31" });
    expect(report.totalCents).toBe(0);
    expect(report.byMonth).toEqual([{ key: "2026-01-01", totalCents: 0, count: 0 }]);
    expect(report.byProperty).toEqual([]);
  });
});

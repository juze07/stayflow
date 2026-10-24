import { describe, expect, it } from "vitest";
import {
  addDays,
  dayRange,
  formatMonth,
  isCalendarDate,
  isClockTime,
  monthGrid,
  parseMonth,
  splitZonedDateTime,
  zonedDateRange,
  zonedDateTimeToUtc,
  zonedToday,
} from "./dates";

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

describe("zonedDateTimeToUtc / splitZonedDateTime", () => {
  it("converte a hora de Lisboa no verão e no inverno", () => {
    expect(zonedDateTimeToUtc("2026-07-15", "10:00", "Europe/Lisbon").toISOString()).toBe("2026-07-15T09:00:00.000Z");
    expect(zonedDateTimeToUtc("2026-01-15", "10:00", "Europe/Lisbon").toISOString()).toBe("2026-01-15T10:00:00.000Z");
  });

  it("converte a hora dos Açores", () => {
    expect(zonedDateTimeToUtc("2026-01-15", "23:30", "Atlantic/Azores").toISOString()).toBe("2026-01-16T00:30:00.000Z");
  });

  it("faz o caminho inverso, incluindo no dia da mudança de hora", () => {
    expect(splitZonedDateTime("2026-10-25T09:00:00Z", "Europe/Lisbon")).toEqual({ date: "2026-10-25", time: "09:00" });
    expect(splitZonedDateTime("2026-03-29T09:00:00Z", "Europe/Lisbon")).toEqual({ date: "2026-03-29", time: "10:00" });
    const instant = zonedDateTimeToUtc("2026-03-29", "15:45", "Europe/Lisbon");
    expect(splitZonedDateTime(instant, "Europe/Lisbon")).toEqual({ date: "2026-03-29", time: "15:45" });
  });
});

describe("validação e aritmética de datas civis", () => {
  it("valida datas e horas", () => {
    expect(isCalendarDate("2026-02-28")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("26-02-01")).toBe(false);
    expect(isClockTime("09:30")).toBe(true);
    expect(isClockTime("24:00")).toBe(false);
  });

  it("soma dias atravessando meses e anos", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("calcula hoje no fuso da empresa", () => {
    expect(zonedToday("Europe/Lisbon", new Date("2026-07-15T23:30:00Z"))).toBe("2026-07-16");
  });

  it("converte um intervalo de datas em instantes UTC", () => {
    const { start, end } = zonedDateRange("2026-07-01", "2026-07-31", "Europe/Lisbon");
    expect(start.toISOString()).toBe("2026-06-30T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-31T23:00:00.000Z");
  });
});

describe("meses e grelha do calendário", () => {
  it("lê e formata meses", () => {
    expect(parseMonth("2026-10")).toEqual({ year: 2026, month: 10 });
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
    expect(formatMonth(2026, 12, 1)).toBe("2027-01");
    expect(formatMonth(2026, 1, -1)).toBe("2025-12");
  });

  it("monta semanas completas a começar à segunda-feira", () => {
    const grid = monthGrid(2026, 10);
    // 1 de outubro de 2026 é quinta-feira: a grelha começa na segunda, 28 de setembro.
    expect(grid[0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(grid.length % 7).toBe(0);
    expect(grid.filter((day) => day.inMonth)).toHaveLength(31);
    expect(grid.at(-1)?.date).toBe("2026-11-01");
  });
});

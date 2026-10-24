import { addDays, formatMonth, isCalendarDate, zonedToday } from "@/lib/dates";
import { MAX_REPORT_DAYS, type ExpenseCategory, type ReportPeriod } from "./constants";

export type ReportRange = { from: string; to: string };

function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}

/**
 * Datas civis (inclusivas) do relatório, no fuso da empresa. Datas
 * personalizadas inválidas, invertidas ou longas demais voltam a "este mês".
 */
export function resolveReportRange(
  period: ReportPeriod,
  custom: { from?: string; to?: string },
  timeZone: string,
  now: Date,
): ReportRange & { period: ReportPeriod } {
  const today = zonedToday(timeZone, now);
  const thisMonth = `${today.slice(0, 7)}-01`;
  switch (period) {
    case "mes-anterior": {
      const lastDay = addDays(thisMonth, -1);
      return { period, from: `${lastDay.slice(0, 7)}-01`, to: lastDay };
    }
    case "ano":
      return { period, from: `${today.slice(0, 4)}-01-01`, to: today };
    case "12m":
      return {
        period,
        from: `${formatMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)), -11)}-01`,
        to: today,
      };
    case "personalizado": {
      const { from, to } = custom;
      if (from && to && isCalendarDate(from) && isCalendarDate(to)) {
        const span = daysBetween(from, to);
        if (span >= 0 && span <= MAX_REPORT_DAYS) return { period, from, to };
      }
      return { period: "mes", from: thisMonth, to: today };
    }
    case "mes":
      return { period, from: thisMonth, to: today };
  }
}

export type ReportRow = {
  month: string;
  propertyId: string | null;
  category: ExpenseCategory;
  totalCents: number;
  count: number;
};

export type ReportGroup<K> = { key: K; totalCents: number; count: number };

export type ExpenseReport = {
  totalCents: number;
  count: number;
  byMonth: ReportGroup<string>[];
  byProperty: ReportGroup<string | null>[];
  byCategory: ReportGroup<ExpenseCategory>[];
};

function group<K>(rows: ReportRow[], keyOf: (row: ReportRow) => K): ReportGroup<K>[] {
  const map = new Map<K, ReportGroup<K>>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = map.get(key) ?? { key, totalCents: 0, count: 0 };
    current.totalCents += row.totalCents;
    current.count += row.count;
    map.set(key, current);
  }
  return [...map.values()];
}

/** Meses (AAAA-MM-01) entre duas datas, inclusivos. */
export function monthsInRange(from: string, to: string): string[] {
  const months: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const last = to.slice(0, 7);
  while (true) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    months.push(`${key}-01`);
    if (key >= last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/** Totais do período: por mês (incluindo meses sem despesas), por propriedade e por categoria. */
export function summarizeReport(rows: ReportRow[], range: ReportRange): ExpenseReport {
  const byMonth = new Map(group(rows, (row) => row.month).map((g) => [g.key, g]));
  const byTotal = <K>(a: ReportGroup<K>, b: ReportGroup<K>) => b.totalCents - a.totalCents;
  return {
    totalCents: rows.reduce((sum, row) => sum + row.totalCents, 0),
    count: rows.reduce((sum, row) => sum + row.count, 0),
    byMonth: monthsInRange(range.from, range.to).map(
      (month) => byMonth.get(month) ?? { key: month, totalCents: 0, count: 0 },
    ),
    byProperty: group(rows, (row) => row.propertyId).sort(byTotal),
    byCategory: group(rows, (row) => row.category).sort(byTotal),
  };
}

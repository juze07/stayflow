import { monthsInRange, type ReportRange } from "@/modules/expenses/report";

export type RevenueRow = {
  month: string;
  /** null: despesas gerais (sem propriedade). */
  propertyId: string | null;
  revenueCents: number;
  expenseCents: number;
};

export type RevenueGroup<K> = { key: K; revenueCents: number; expenseCents: number; profitCents: number };

export type RevenueSummary = {
  revenueCents: number;
  expenseCents: number;
  profitCents: number;
  /** Margem em percentagem (null sem receitas). */
  marginPercent: number | null;
  byMonth: RevenueGroup<string>[];
  byProperty: RevenueGroup<string | null>[];
};

function group<K>(rows: RevenueRow[], keyOf: (row: RevenueRow) => K): Map<K, RevenueGroup<K>> {
  const map = new Map<K, RevenueGroup<K>>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = map.get(key) ?? { key, revenueCents: 0, expenseCents: 0, profitCents: 0 };
    current.revenueCents += row.revenueCents;
    current.expenseCents += row.expenseCents;
    current.profitCents = current.revenueCents - current.expenseCents;
    map.set(key, current);
  }
  return map;
}

/** Receitas, despesas e resultado do período: por mês (incluindo meses vazios) e por propriedade. */
export function summarizeRevenue(rows: RevenueRow[], range: ReportRange): RevenueSummary {
  const revenueCents = rows.reduce((sum, row) => sum + row.revenueCents, 0);
  const expenseCents = rows.reduce((sum, row) => sum + row.expenseCents, 0);
  const profitCents = revenueCents - expenseCents;
  const byMonth = group(rows, (row) => row.month);
  return {
    revenueCents,
    expenseCents,
    profitCents,
    marginPercent: revenueCents > 0 ? Math.round((profitCents / revenueCents) * 100) : null,
    byMonth: monthsInRange(range.from, range.to).map(
      (month) => byMonth.get(month) ?? { key: month, revenueCents: 0, expenseCents: 0, profitCents: 0 },
    ),
    byProperty: [...group(rows, (row) => row.propertyId).values()].sort((a, b) => b.profitCents - a.profitCents),
  };
}

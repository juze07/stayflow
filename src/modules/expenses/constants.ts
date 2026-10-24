/** Categorias das despesas (iguais ao CHECK da base de dados). */

export const EXPENSE_CATEGORIES = ["cleaning", "maintenance", "supplies", "laundry", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cleaning: "Limpeza",
  maintenance: "Manutenção",
  supplies: "Consumíveis",
  laundry: "Lavandaria",
  other: "Outro",
};

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

/** Períodos rápidos do relatório; "personalizado" usa as datas `de` e `ate`. */
export const REPORT_PERIODS = ["mes", "mes-anterior", "ano", "12m", "personalizado"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  mes: "Este mês",
  "mes-anterior": "Mês passado",
  ano: "Este ano",
  "12m": "Últimos 12 meses",
  personalizado: "Datas à escolha",
};

/** Limite do intervalo do relatório (igual ao da função `expense_report`). */
export const MAX_REPORT_DAYS = 1100;

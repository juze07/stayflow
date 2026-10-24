/** Categorias, estados e prioridades dos problemas de manutenção (iguais aos CHECK da base de dados). */

export const ISSUE_CATEGORIES = [
  "plumbing",
  "electrical",
  "appliances",
  "furniture",
  "structure",
  "cleaning",
  "other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  plumbing: "Canalização",
  electrical: "Eletricidade",
  appliances: "Eletrodomésticos",
  furniture: "Mobiliário",
  structure: "Estrutura",
  cleaning: "Limpeza",
  other: "Outro",
};

export const ISSUE_STATUSES = ["open", "investigating", "in_progress", "resolved", "cancelled"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Aberto",
  investigating: "Em análise",
  in_progress: "Em reparação",
  resolved: "Resolvido",
  cancelled: "Cancelado",
};

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const ISSUE_STATUS_TONES: Record<IssueStatus, Tone> = {
  open: "warning",
  investigating: "info",
  in_progress: "info",
  resolved: "success",
  cancelled: "neutral",
};

export const OPEN_ISSUE_STATUSES: IssueStatus[] = ["open", "investigating", "in_progress"];

/** Filtros de estado da lista: os estados mais dois atalhos. */
export const ISSUE_STATUS_FILTERS = ["abertos", ...ISSUE_STATUSES, "todos"] as const;
export type IssueStatusFilter = (typeof ISSUE_STATUS_FILTERS)[number];

export const ISSUE_STATUS_FILTER_LABELS: Record<IssueStatusFilter, string> = {
  abertos: "Por resolver",
  ...ISSUE_STATUS_LABELS,
  todos: "Todos",
};

export function isIssueStatus(value: string): value is IssueStatus {
  return (ISSUE_STATUSES as readonly string[]).includes(value);
}

export function isIssueCategory(value: string): value is IssueCategory {
  return (ISSUE_CATEGORIES as readonly string[]).includes(value);
}

/** Mudanças de estado oferecidas a partir de cada estado. */
export function nextIssueStatuses(status: IssueStatus): IssueStatus[] {
  switch (status) {
    case "open":
      return ["investigating", "in_progress", "resolved", "cancelled"];
    case "investigating":
      return ["in_progress", "resolved", "cancelled"];
    case "in_progress":
      return ["resolved", "investigating", "cancelled"];
    case "resolved":
    case "cancelled":
      return ["open"];
  }
}

export const ISSUE_STATUS_ACTION_LABELS: Record<IssueStatus, string> = {
  open: "Reabrir",
  investigating: "Em análise",
  in_progress: "Em reparação",
  resolved: "Marcar como resolvido",
  cancelled: "Cancelar",
};

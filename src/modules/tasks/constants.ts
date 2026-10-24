/**
 * Tipos, estados e prioridades das tarefas. Os mesmos valores estão
 * restringidos na base de dados (CHECK), por isso não podem divergir.
 */

export const TASK_TYPES = ["cleaning", "inspection", "maintenance", "preparation", "restock", "other"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  cleaning: "Limpeza",
  inspection: "Inspeção",
  maintenance: "Manutenção",
  preparation: "Preparação",
  restock: "Reposição",
  other: "Outra",
};

export const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Por iniciar",
  in_progress: "Em curso",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const TASK_STATUS_TONES: Record<TaskStatus, Tone> = {
  pending: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
};

export const TASK_PRIORITY_TONES: Record<TaskPriority, Tone> = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "danger",
};

/** Filtros de estado da lista: os estados da base de dados mais dois atalhos. */
export const TASK_STATUS_FILTERS = ["abertas", "atrasadas", ...TASK_STATUSES, "todas"] as const;
export type TaskStatusFilter = (typeof TASK_STATUS_FILTERS)[number];

export const TASK_STATUS_FILTER_LABELS: Record<TaskStatusFilter, string> = {
  abertas: "Por fazer (por iniciar ou em curso)",
  atrasadas: "Atrasadas",
  ...TASK_STATUS_LABELS,
  todas: "Todas",
};

export const OPEN_STATUSES: TaskStatus[] = ["pending", "in_progress"];

export function isTaskType(value: string): value is TaskType {
  return (TASK_TYPES as readonly string[]).includes(value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

/** Uma tarefa está atrasada quando ainda está por fazer e a hora marcada já passou. */
export function isOverdue(task: { status: string; scheduledAt: string }, now: Date): boolean {
  return (task.status === "pending" || task.status === "in_progress") && new Date(task.scheduledAt) < now;
}

/**
 * Mudanças de estado que a interface oferece a partir de cada estado.
 * A base de dados aceita qualquer estado válido; isto evita saltos confusos.
 */
export function nextStatuses(status: TaskStatus): TaskStatus[] {
  switch (status) {
    case "pending":
      return ["in_progress", "completed", "cancelled"];
    case "in_progress":
      return ["completed", "pending", "cancelled"];
    case "completed":
      return ["in_progress"];
    case "cancelled":
      return ["pending"];
  }
}

/** Texto do botão para cada mudança de estado. */
export const STATUS_ACTION_LABELS: Record<TaskStatus, string> = {
  pending: "Repor como por iniciar",
  in_progress: "Iniciar",
  completed: "Concluir",
  cancelled: "Cancelar tarefa",
};

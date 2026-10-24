import { TASK_STATUS_LABELS, isTaskStatus } from "@/modules/tasks/constants";

type ActivityLike = {
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
};

const ENTITY_NAMES: Record<string, string> = {
  property: "a propriedade",
  task: "a tarefa",
  inspection: "a inspeção",
  maintenance_issue: "o problema",
  expense: "a despesa",
};

const ACTION_VERBS: Record<string, string> = {
  created: "criou",
  deleted: "apagou",
  archived: "arquivou",
  restored: "reativou",
};

/** Frase legível para uma entrada do registo de atividade, ex.: "concluiu a tarefa Limpeza T2". */
export function describeActivity(item: ActivityLike): string {
  const entity = ENTITY_NAMES[item.entityType] ?? "um registo";
  const name = item.summary ? ` "${item.summary}"` : "";

  if (item.action === "status_changed") {
    const to = typeof item.metadata.to === "string" ? item.metadata.to : "";
    if (item.entityType === "task" && isTaskStatus(to)) {
      if (to === "completed") return `concluiu ${entity}${name}`;
      if (to === "in_progress") return `iniciou ${entity}${name}`;
      if (to === "cancelled") return `cancelou ${entity}${name}`;
      return `mudou ${entity}${name} para "${TASK_STATUS_LABELS[to]}"`;
    }
    // "o problema" -> "do problema"; "a inspeção" -> "da inspeção".
    const contracted = `d${entity}`;
    return `atualizou o estado ${contracted}${name}`;
  }

  return `${ACTION_VERBS[item.action] ?? "alterou"} ${entity}${name}`;
}

/** Endereço do registo, quando existe uma página para ele. Registos apagados não têm. */
export function activityHref(item: ActivityLike): string | null {
  if (item.action === "deleted") return null;
  if (item.entityType === "task") return `/tarefas/${item.entityId}`;
  if (item.entityType === "property") return `/propriedades/${item.entityId}`;
  return null;
}

import { isCalendarDate, parseMonth, zonedDateRange, zonedToday } from "@/lib/dates";
import { getEnumParam, getPage, getParam, type SearchParams } from "@/lib/search-params";
import { TASK_PRIORITIES, TASK_STATUS_FILTERS, TASK_TYPES } from "./constants";
import type { TaskFilters } from "./queries";

/** Nomes dos parâmetros no URL, em português porque aparecem na barra de endereço. */
export const TASK_FILTER_KEYS = [
  "q",
  "propriedade",
  "responsavel",
  "tipo",
  "estado",
  "prioridade",
  "de",
  "ate",
] as const;

export type TaskView = "lista" | "calendario";

export type ParsedTaskParams = {
  view: TaskView;
  page: number;
  month: { year: number; month: number };
  /** Valores atuais dos filtros, como estão no URL (para preencher os campos). */
  values: Record<(typeof TASK_FILTER_KEYS)[number], string | undefined>;
  filters: Omit<TaskFilters, "businessId">;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converte os parâmetros do URL em filtros seguros. Valores desconhecidos são
 * ignorados (como se o filtro não existisse), nunca enviados à base de dados.
 */
export function parseTaskParams(
  params: SearchParams,
  { userId, timeZone, now }: { userId: string; timeZone: string; now: Date },
): ParsedTaskParams {
  const view: TaskView = getParam(params, "vista") === "calendario" ? "calendario" : "lista";

  const propertyParam = getParam(params, "propriedade");
  const propertyId = propertyParam && UUID_PATTERN.test(propertyParam) ? propertyParam : undefined;

  const assigneeParam = getParam(params, "responsavel");
  const assigneeId =
    assigneeParam === "eu"
      ? userId
      : assigneeParam === "ninguem"
        ? ("none" as const)
        : assigneeParam && UUID_PATTERN.test(assigneeParam)
          ? assigneeParam
          : undefined;

  const fromParam = getParam(params, "de");
  const toParam = getParam(params, "ate");
  const fromDate = fromParam && isCalendarDate(fromParam) ? fromParam : undefined;
  const toDate = toParam && isCalendarDate(toParam) ? toParam : undefined;
  const from = fromDate ? zonedDateRange(fromDate, fromDate, timeZone).start : undefined;
  const to = toDate ? zonedDateRange(toDate, toDate, timeZone).end : undefined;

  const today = zonedToday(timeZone, now);
  const month = parseMonth(getParam(params, "mes")) ?? {
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  };

  const status = getEnumParam(params, "estado", TASK_STATUS_FILTERS);

  return {
    view,
    page: getPage(params),
    month,
    values: {
      q: getParam(params, "q"),
      propriedade: propertyId,
      responsavel: assigneeId ? assigneeParam : undefined,
      tipo: getEnumParam(params, "tipo", TASK_TYPES),
      estado: status,
      prioridade: getEnumParam(params, "prioridade", TASK_PRIORITIES),
      de: fromDate,
      ate: toDate,
    },
    filters: {
      search: getParam(params, "q"),
      propertyId,
      assigneeId,
      type: getEnumParam(params, "tipo", TASK_TYPES),
      // No calendário, por defeito mostram-se todas (incluindo concluídas).
      status: status ?? (view === "calendario" ? "todas" : "abertas"),
      priority: getEnumParam(params, "prioridade", TASK_PRIORITIES),
      from,
      to,
    },
  };
}

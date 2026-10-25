import { CalendarDays, List, Plus } from "@/components/ui/icons";
import Link from "next/link";
import { FilterBar, type FilterField } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { formatMonth, zonedDateRange } from "@/lib/dates";
import { requestTime } from "@/lib/now";
import { buildHref, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_FILTERS,
  TASK_STATUS_FILTER_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
} from "../constants";
import { parseTaskParams } from "../filters";
import { listAssigneeOptions, listTasks, listTasksInRange } from "../queries";
import { TaskCalendar } from "./task-calendar";
import { TaskList } from "./task-list";

/** Páginas próprias de limpezas e inspeções: a mesma vista, com o tipo fixo. */
const FIXED_TYPE_PAGES = {
  cleaning: {
    basePath: "/limpezas",
    title: "Limpezas",
    description: "Limpezas das propriedades, com a lista de verificação de cada uma.",
    newLabel: "Nova limpeza",
    emptyTitle: "Sem limpezas por fazer",
  },
  inspection: {
    basePath: "/inspecoes",
    title: "Inspeções",
    description: "Inspeções das propriedades, com lista de verificação e resultado.",
    newLabel: "Nova inspeção",
    emptyTitle: "Sem inspeções por fazer",
  },
} as const;

type TasksViewProps = {
  searchParams: Promise<SearchParams>;
  fixedType?: keyof typeof FIXED_TYPE_PAGES;
};

export async function TasksView({ searchParams, fixedType }: TasksViewProps) {
  const [{ business, role, user }, params] = await Promise.all([requireBusiness(), searchParams]);
  const now = requestTime();
  const parsed = parseTaskParams(params, { userId: user.id, timeZone: business.timezone, now });
  const page = fixedType ? FIXED_TYPE_PAGES[fixedType] : null;
  const basePath = page?.basePath ?? "/tarefas";
  if (fixedType) {
    parsed.values.tipo = undefined;
    parsed.filters.type = fixedType;
  }
  const canManage = canManageOperations(role);
  const isCalendar = parsed.view === "calendario";

  const [properties, assignees] = await Promise.all([
    listPropertyOptions(business.id, { includeArchived: true }),
    listAssigneeOptions(business.id),
  ]);

  const fields: FilterField[] = [
    { type: "search", name: "q", label: "Pesquisar", placeholder: "Título da tarefa" },
    {
      type: "select",
      name: "propriedade",
      label: "Propriedade",
      allLabel: "Todas",
      options: properties.map((p) => ({ value: p.id, label: p.archived ? `${p.name} (arquivada)` : p.name })),
    },
    {
      type: "select",
      name: "responsavel",
      label: "Responsável",
      options: [
        { value: "eu", label: "As minhas tarefas" },
        { value: "ninguem", label: "Sem responsável" },
        ...assignees.filter((m) => m.id !== user.id).map((m) => ({ value: m.id, label: m.name })),
      ],
    },
    ...(fixedType
      ? []
      : ([
          {
            type: "select",
            name: "tipo",
            label: "Tipo",
            options: TASK_TYPES.map((type) => ({ value: type, label: TASK_TYPE_LABELS[type] })),
          },
        ] satisfies FilterField[])),
    {
      type: "select",
      name: "estado",
      label: "Estado",
      allLabel: isCalendar ? "Todas" : TASK_STATUS_FILTER_LABELS.abertas,
      options: TASK_STATUS_FILTERS.filter((s) => s !== (isCalendar ? "todas" : "abertas")).map((s) => ({
        value: s,
        label: TASK_STATUS_FILTER_LABELS[s],
      })),
    },
    {
      type: "select",
      name: "prioridade",
      label: "Prioridade",
      allLabel: "Todas",
      options: TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] })),
    },
    ...(isCalendar
      ? []
      : ([
          { type: "date", name: "de", label: "De" },
          { type: "date", name: "ate", label: "Até" },
        ] satisfies FilterField[])),
  ];

  const hasFilters = Object.values(parsed.values).some(Boolean);
  const viewParams = { ...parsed.values, de: undefined, ate: undefined };

  return (
    <div className="space-y-6">
      <PageHeader
        title={page?.title ?? "Tarefas"}
        description={page?.description ?? "Limpezas, inspeções, manutenção e outras tarefas das propriedades."}
        actions={
          <>
            <div className="inline-flex rounded-lg border border-border bg-muted p-0.5" role="group" aria-label="Vista">
              <ViewLink href={buildHref(basePath, { ...parsed.values })} active={!isCalendar} icon="list">
                Lista
              </ViewLink>
              <ViewLink
                href={buildHref(basePath, { ...viewParams, vista: "calendario" })}
                active={isCalendar}
                icon="calendar"
              >
                Calendário
              </ViewLink>
            </div>
            {canManage && (
              <Button asChild>
                <Link href={buildHref("/tarefas/nova", { propriedade: parsed.values.propriedade, tipo: fixedType })}>
                  <Plus aria-hidden />
                  {page?.newLabel ?? "Nova tarefa"}
                </Link>
              </Button>
            )}
          </>
        }
      />

      <FilterBar
        fields={fields}
        values={parsed.values}
        preserve={
          isCalendar ? { vista: "calendario", mes: formatMonth(parsed.month.year, parsed.month.month) } : undefined
        }
      />

      {isCalendar ? (
        <CalendarSection
          businessId={business.id}
          timeZone={business.timezone}
          now={now}
          parsed={parsed}
          basePath={basePath}
        />
      ) : (
        <ListSection
          businessId={business.id}
          timeZone={business.timezone}
          now={now}
          parsed={parsed}
          basePath={basePath}
          fixedType={fixedType}
          hasFilters={hasFilters}
          canManage={canManage}
          hasProperties={properties.some((p) => !p.archived)}
        />
      )}
    </div>
  );
}

type SectionProps = {
  businessId: string;
  timeZone: string;
  now: Date;
  parsed: ReturnType<typeof parseTaskParams>;
  basePath: string;
};

async function ListSection({
  businessId,
  timeZone,
  now,
  parsed,
  basePath,
  fixedType,
  hasFilters,
  canManage,
  hasProperties,
}: SectionProps & {
  fixedType?: TasksViewProps["fixedType"];
  hasFilters: boolean;
  canManage: boolean;
  hasProperties: boolean;
}) {
  const page = fixedType ? FIXED_TYPE_PAGES[fixedType] : null;
  const { items, total, pageSize } = await listTasks({ businessId, ...parsed.filters, page: parsed.page }, now);

  const empty = hasFilters
    ? { title: "Nenhuma tarefa encontrada", description: "Experimente alterar ou limpar os filtros." }
    : !hasProperties
      ? {
          title: "Ainda não há propriedades",
          description: "As tarefas pertencem a uma propriedade. Comece por registar a primeira.",
          action: canManage ? (
            <Button asChild>
              <Link href="/propriedades/nova">Registar propriedade</Link>
            </Button>
          ) : undefined,
        }
      : {
          title: page?.emptyTitle ?? "Sem tarefas por fazer",
          description: canManage ? "Crie uma tarefa para a equipa." : "Não há tarefas por fazer neste momento.",
          action: canManage ? (
            <Button asChild>
              <Link href={buildHref("/tarefas/nova", { tipo: fixedType })}>{page?.newLabel ?? "Nova tarefa"}</Link>
            </Button>
          ) : undefined,
        };

  return (
    <div className="space-y-4">
      <TaskList tasks={items} timeZone={timeZone} now={now} empty={empty} />
      <Pagination pathname={basePath} params={parsed.values} page={parsed.page} pageSize={pageSize} total={total} />
    </div>
  );
}

async function CalendarSection({ businessId, timeZone, now, parsed, basePath }: SectionProps) {
  const { year, month } = parsed.month;
  const first = `${formatMonth(year, month)}-01`;
  const last = `${formatMonth(year, month, 1)}-01`;
  // Inclui a semana anterior e seguinte, que também aparecem na grelha.
  const range = zonedDateRange(first, last, timeZone);
  const from = new Date(range.start.getTime() - 7 * 86_400_000);
  const to = new Date(range.end.getTime() + 7 * 86_400_000);

  const { items, truncated } = await listTasksInRange({ businessId, ...parsed.filters, from, to });
  const base = { ...parsed.values, de: undefined, ate: undefined, vista: "calendario" };

  return (
    <TaskCalendar
      year={year}
      month={month}
      tasks={items}
      truncated={truncated}
      timeZone={timeZone}
      now={now}
      basePath={basePath}
      previousHref={buildHref(basePath, { ...base, mes: formatMonth(year, month, -1) })}
      nextHref={buildHref(basePath, { ...base, mes: formatMonth(year, month, 1) })}
      todayHref={buildHref(basePath, base)}
    />
  );
}

function ViewLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: "list" | "calendar";
  children: string;
}) {
  const Icon = icon === "list" ? List : CalendarDays;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-all sm:h-8",
        active
          ? "bg-surface text-foreground shadow-raised ring-1 ring-border"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

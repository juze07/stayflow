import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Wrench,
  type IconComponent,
} from "@/components/ui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { zonedToday } from "@/lib/dates";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { getEnumParam, type SearchParams } from "@/lib/search-params";
import { canManageBusiness, canManageOperations } from "@/modules/business/roles";
import { requireBusiness } from "@/modules/business/queries";
import { isOverdue } from "@/modules/tasks/constants";
import { OverdueBadge, TaskPriorityBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";
import type { TaskListItem } from "@/modules/tasks/queries";
import { activityHref, describeActivity } from "../activity";
import { PERIOD_LABELS, PERIODS, periodRange } from "../period";
import {
  getDashboardOverview,
  getExpenseSeries,
  getTaskSeries,
  listAttentionTasks,
  listRecentActivity,
  listRecentlyCompleted,
  listTodayTasks,
  sumExpenses,
} from "../queries";
import { ExpenseSeriesChart, TaskSeriesChart } from "./charts";
import { GettingStarted, type GettingStartedStep } from "./getting-started";
import { PeriodSelect } from "./period-select";
import { StatCard, StatCardSkeleton, StatGroup } from "./stat-card";

export async function DashboardOverview({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role, user }, params] = await Promise.all([requireBusiness(), searchParams]);
  const now = requestTime();
  const tz = business.timezone;
  const canManage = canManageOperations(role);
  const period = getEnumParam(params, "periodo", PERIODS) ?? "7d";
  const range = periodRange(period, tz, now);
  const todayDate = zonedToday(tz, now);

  const [overview, taskSeries, expenseSeries, attention, today, completed, activity] = await Promise.all([
    getDashboardOverview(business.id, tz, now),
    getTaskSeries(business.id, range.from, range.to, tz),
    canManage ? getExpenseSeries(business.id, range.from, range.to) : Promise.resolve([]),
    listAttentionTasks(business.id, now),
    // Colaboradores veem primeiro o que lhes está atribuído.
    listTodayTasks(business.id, tz, now, canManage ? undefined : user.id),
    listRecentlyCompleted(business.id, now),
    listRecentActivity(business.id),
  ]);

  const completedInPeriod = taskSeries.reduce((total, point) => total + point.completed, 0);
  const scheduledInPeriod = taskSeries.reduce((total, point) => total + point.scheduled, 0);
  const expensesTotal = sumExpenses(expenseSeries);

  const steps: GettingStartedStep[] = [
    { title: "Criar a empresa", description: `${business.name} está pronta a usar.`, done: true },
    {
      title: "Completar os dados da empresa",
      description: "Morada, contactos e fuso horário.",
      done: overview.hasBusinessDetails,
      href: canManageBusiness(role) ? "/definicoes/empresa" : undefined,
    },
    {
      title: "Convidar a equipa",
      description: "Gestores e colaboradores de limpeza, inspeção e manutenção.",
      done: overview.teamSize > 1 || overview.pendingInvitations > 0,
      href: canManage ? "/definicoes/equipa" : undefined,
    },
    {
      title: "Registar as propriedades",
      description: "O ponto de partida para tarefas, limpezas e despesas.",
      done: overview.activeProperties > 0,
      href: canManage ? "/propriedades/nova" : undefined,
    },
  ];
  const showGettingStarted = canManage && steps.some((step) => !step.done);

  return (
    <div className="space-y-8">
      {showGettingStarted && <GettingStarted steps={steps} />}

      <StatGroup>
        <StatCard
          label="Tarefas para hoje"
          value={overview.tasksToday}
          icon={CalendarCheck}
          href={`/tarefas?estado=todas&de=${todayDate}&ate=${todayDate}`}
        />
        <StatCard
          label="Tarefas atrasadas"
          value={overview.overdueTasks}
          icon={AlertTriangle}
          tone={overview.overdueTasks > 0 ? "danger" : undefined}
          href="/tarefas?estado=atrasadas"
        />
        <StatCard label="Propriedades ativas" value={overview.activeProperties} icon={Building2} href="/propriedades" />
        <StatCard label="Problemas em aberto" value={overview.openIssues} icon={Wrench} href="/manutencao" />
      </StatGroup>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskPanel
          title="Precisam de atenção"
          description="Atrasadas ou urgentes, ainda por fazer."
          tasks={attention}
          timeZone={tz}
          now={now}
          empty="Nada atrasado nem urgente."
          emptyIcon={CheckCircle2}
          moreHref="/tarefas?estado=atrasadas"
          showDate
        />
        <TaskPanel
          title={canManage ? "Hoje" : "As minhas tarefas de hoje"}
          description={`${today.total} ${today.total === 1 ? "tarefa marcada" : "tarefas marcadas"} para hoje.`}
          tasks={today.items.slice(0, 6)}
          timeZone={tz}
          now={now}
          empty="Sem tarefas marcadas para hoje."
          emptyIcon={CalendarCheck}
          moreHref={canManage ? "/tarefas?vista=calendario" : "/tarefas?responsavel=eu"}
        />
      </div>

      <section className="space-y-4" aria-labelledby="periodo-titulo">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="periodo-titulo" className="font-display text-2xl leading-tight text-foreground">
              {PERIOD_LABELS[period]}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Evolução das tarefas{canManage ? " e das despesas" : ""}.
            </p>
          </div>
          <PeriodSelect value={period} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={canManage ? undefined : "lg:col-span-2"}>
            <CardHeader className="space-y-4">
              <div className="space-y-1">
                <CardTitle>Tarefas por dia</CardTitle>
                <CardDescription>Agendadas para o dia e concluídas nesse dia (exclui canceladas).</CardDescription>
              </div>
              <dl className="flex gap-8">
                <Metric label="Tarefas agendadas" value={scheduledInPeriod} swatch="bg-chart-2" />
                <Metric label="Tarefas concluídas" value={completedInPeriod} swatch="bg-chart-1" />
              </dl>
            </CardHeader>
            <CardContent>
              {scheduledInPeriod + completedInPeriod === 0 ? (
                <EmptyChart>Sem tarefas neste período.</EmptyChart>
              ) : (
                <>
                  <TaskSeriesChart data={taskSeries} />
                  <DataTable
                    caption="Tarefas por dia"
                    headers={["Dia", "Agendadas", "Concluídas"]}
                    rows={taskSeries.map((p) => [p.day.split("-").reverse().join("/"), p.scheduled, p.completed])}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>Despesas por dia</CardTitle>
                    <CardDescription>Pela data da despesa.</CardDescription>
                  </div>
                  <MoreLink href="/despesas/relatorio">Ver relatório completo</MoreLink>
                </div>
                <dl className="flex gap-8">
                  <Metric label="Despesas" value={formatCurrency(expensesTotal)} />
                </dl>
              </CardHeader>
              <CardContent>
                {expensesTotal === 0 ? (
                  <EmptyChart>Sem despesas registadas neste período.</EmptyChart>
                ) : (
                  <>
                    <ExpenseSeriesChart data={expenseSeries} />
                    <DataTable
                      caption="Despesas por dia"
                      headers={["Dia", "Valor"]}
                      rows={expenseSeries.map((p) => [
                        p.day.split("-").reverse().join("/"),
                        formatCurrency(p.amountCents),
                      ])}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Concluídas recentemente</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {completed.length === 0 ? (
              <PanelEmpty icon={CheckCircle2}>Ainda não há tarefas concluídas.</PanelEmpty>
            ) : (
              <ul className="-mx-2">
                {completed.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tarefas/${task.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                        <CheckCircle2 className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {task.property?.name} · {formatDateTime(task.completedAt ?? task.scheduledAt, tz)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activity.length === 0 ? (
              <PanelEmpty icon={Activity}>Ainda não há atividade registada.</PanelEmpty>
            ) : (
              <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
                {activity.map((item) => {
                  const href = activityHref(item);
                  const text = (
                    <>
                      <span className="font-medium text-foreground">{item.actorName ?? "Sistema"}</span>{" "}
                      {describeActivity(item)}
                    </>
                  );
                  return (
                    <li key={item.id} className="relative flex gap-3 text-sm">
                      <span
                        aria-hidden
                        className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-surface bg-border-strong"
                      />
                      <div className="min-w-0">
                        {href ? (
                          <Link href={href} className="text-muted-foreground hover:text-foreground">
                            {text}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{text}</span>
                        )}
                        <p className="text-xs text-subtle-foreground tabular-nums">
                          {formatDateTime(item.createdAt, tz)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, swatch }: { label: string; value: number | string; swatch?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {swatch && <span aria-hidden className={`size-2 rounded-full ${swatch}`} />}
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function PanelEmpty({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
      <Icon className="size-5 text-subtle-foreground" aria-hidden />
      {children}
    </div>
  );
}

type TaskPanelProps = {
  title: string;
  description: string;
  tasks: TaskListItem[];
  timeZone: string;
  now: Date;
  empty: string;
  emptyIcon: IconComponent;
  moreHref: string;
  showDate?: boolean;
};

function TaskPanel({ title, description, tasks, timeZone, now, empty, emptyIcon, moreHref, showDate }: TaskPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <MoreLink href={moreHref}>Ver tarefas</MoreLink>
      </CardHeader>
      <CardContent className="pt-3">
        {tasks.length === 0 ? (
          <PanelEmpty icon={emptyIcon}>{empty}</PanelEmpty>
        ) : (
          <ul className="-mx-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tarefas/${task.id}`}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span className="mt-px w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {showDate
                      ? formatDateTime(task.scheduledAt, timeZone).slice(0, 5)
                      : formatTime(task.scheduledAt, timeZone)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {task.property?.name} · {task.assignee?.name ?? "Sem responsável"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <TaskStatusBadge status={task.status} />
                      {isOverdue(task, now) && <OverdueBadge />}
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-raised text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Os mesmos números do gráfico, em tabela, para leitores de ecrã e para quem prefere ler valores. */
function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-[13px] text-muted-foreground transition-colors hover:text-foreground">
        Ver dados em tabela
      </summary>
      <div className="mt-2 max-h-64 overflow-y-auto">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-xs text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="py-1 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={String(row[0])}>
                {row.map((cell, index) => (
                  <td key={index} className="py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="A carregar indicadores">
      <StatGroup>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </StatGroup>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((key) => (
          <Card key={key} className="space-y-4 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-3/4" />
          </Card>
        ))}
      </div>
    </div>
  );
}

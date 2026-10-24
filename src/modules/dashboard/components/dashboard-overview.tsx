import { AlertTriangle, Building2, CalendarCheck, CheckCircle2, Receipt, Wrench } from "lucide-react";
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
import { StatCard, StatCardSkeleton } from "./stat-card";

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
    <div className="space-y-6">
      {showGettingStarted && <GettingStarted steps={steps} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <StatCard label="Problemas em aberto" value={overview.openIssues} icon={Wrench} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskPanel
          title="Precisam de atenção"
          description="Atrasadas ou urgentes, ainda por fazer."
          tasks={attention}
          timeZone={tz}
          now={now}
          empty="Nada atrasado nem urgente. 👍"
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
          moreHref={canManage ? "/tarefas?vista=calendario" : "/tarefas?responsavel=eu"}
        />
      </div>

      <section className="space-y-4" aria-labelledby="periodo-titulo">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="periodo-titulo" className="text-lg font-semibold text-foreground">
            {PERIOD_LABELS[period]}
          </h2>
          <PeriodSelect value={period} />
        </div>

        <div className={canManage ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
          <StatCard label="Tarefas agendadas" value={scheduledInPeriod} icon={CalendarCheck} />
          <StatCard label="Tarefas concluídas" value={completedInPeriod} icon={CheckCircle2} />
          {canManage && <StatCard label="Despesas" value={formatCurrency(expensesTotal)} icon={Receipt} />}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={canManage ? undefined : "lg:col-span-2"}>
            <CardHeader>
              <CardTitle>Tarefas por dia</CardTitle>
              <CardDescription>Agendadas para o dia e concluídas nesse dia (exclui canceladas).</CardDescription>
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
              <CardHeader>
                <CardTitle>Despesas por dia</CardTitle>
                <CardDescription>O registo de despesas chega na Fase 5; até lá o gráfico fica vazio.</CardDescription>
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
          <CardContent>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há tarefas concluídas.</p>
            ) : (
              <ul className="divide-y divide-border">
                {completed.map((task) => (
                  <li key={task.id}>
                    <Link href={`/tarefas/${task.id}`} className="-mx-2 block rounded-md px-2 py-2.5 hover:bg-muted">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {task.property?.name} · {formatDateTime(task.completedAt ?? task.scheduledAt, tz)}
                      </p>
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
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há atividade registada.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((item) => {
                  const href = activityHref(item);
                  const text = (
                    <>
                      <span className="font-medium text-foreground">{item.actorName ?? "Sistema"}</span>{" "}
                      {describeActivity(item)}
                    </>
                  );
                  return (
                    <li key={item.id} className="text-sm">
                      {href ? (
                        <Link href={href} className="text-muted-foreground hover:underline">
                          {text}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{text}</span>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt, tz)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
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
  moreHref: string;
  showDate?: boolean;
};

function TaskPanel({ title, description, tasks, timeZone, now, empty, moreHref, showDate }: TaskPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Link href={moreHref} className="shrink-0 text-sm font-medium text-primary hover:underline">
          Ver tarefas
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tarefas/${task.id}`}
                  className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
                >
                  <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {showDate
                      ? formatDateTime(task.scheduledAt, timeZone).slice(0, 5)
                      : formatTime(task.scheduledAt, timeZone)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {task.property?.name} · {task.assignee?.name ?? "Sem responsável"}
                    </p>
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
    <p className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Os mesmos números do gráfico, em tabela, para leitores de ecrã e para quem prefere ler valores. */
function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver dados em tabela</summary>
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
    <div className="space-y-6" role="status" aria-label="A carregar indicadores">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
        <Card className="space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    </div>
  );
}

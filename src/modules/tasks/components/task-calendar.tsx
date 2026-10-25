import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { monthGrid, splitZonedDateTime, zonedToday } from "@/lib/dates";
import { formatTime } from "@/lib/format";
import { buildHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { isOverdue } from "../constants";
import type { TaskListItem } from "../queries";
import { OverdueBadge, TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

type TaskCalendarProps = {
  year: number;
  month: number;
  tasks: TaskListItem[];
  truncated: boolean;
  timeZone: string;
  now: Date;
  /** Endereços para o mês anterior e seguinte (mantêm os filtros). */
  /** Página onde o calendário está (tarefas, limpezas ou inspeções). */
  basePath: string;
  previousHref: string;
  nextHref: string;
  todayHref: string;
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MAX_PER_DAY = 3;

/**
 * Calendário mensal. Em ecrãs grandes mostra a grelha; no telemóvel, onde a
 * grelha seria ilegível, mostra a agenda dia a dia (só dias com tarefas).
 */
export function TaskCalendar(props: TaskCalendarProps) {
  const { year, month, tasks, truncated, timeZone, now } = props;
  const today = zonedToday(timeZone, now);
  const days = monthGrid(year, month);

  const byDay = new Map<string, TaskListItem[]>();
  for (const task of tasks) {
    const { date } = splitZonedDateTime(task.scheduledAt, timeZone);
    byDay.set(date, [...(byDay.get(date) ?? []), task]);
  }

  const monthLabel = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  const agendaDays = days.filter((day) => day.inMonth && byDay.has(day.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground first-letter:uppercase">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Link href={props.todayHref} className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted">
            Hoje
          </Link>
          <Link href={props.previousHref} className="rounded-md p-2 hover:bg-muted" aria-label="Mês anterior">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link href={props.nextHref} className="rounded-md p-2 hover:bg-muted" aria-label="Mês seguinte">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {truncated && (
        <Alert tone="warning">
          Este mês tem demasiadas tarefas para mostrar todas. Use os filtros para reduzir a lista.
        </Alert>
      )}

      <Card className="hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-border bg-surface-raised text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="py-2">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayTasks = byDay.get(day.date) ?? [];
            const hidden = dayTasks.length - MAX_PER_DAY;
            return (
              <div
                key={day.date}
                className={cn(
                  "min-h-28 border-border p-1.5",
                  index % 7 !== 6 && "border-r",
                  index < days.length - 7 && "border-b",
                  !day.inMonth && "bg-surface-raised",
                )}
              >
                <p
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    day.inMonth ? "text-foreground" : "text-muted-foreground",
                    day.date === today && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {Number(day.date.slice(8))}
                </p>
                <ul className="space-y-1">
                  {dayTasks.slice(0, MAX_PER_DAY).map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tarefas/${task.id}`}
                        title={`${task.title} · ${task.property?.name ?? ""}`}
                        className={cn(
                          "block truncate rounded px-1.5 py-0.5 text-xs",
                          task.status === "completed" && "bg-success-soft text-success line-through",
                          task.status === "cancelled" && "bg-muted text-muted-foreground line-through",
                          (task.status === "pending" || task.status === "in_progress") &&
                            (isOverdue(task, now) || task.priority === "urgent"
                              ? "bg-destructive-soft text-destructive"
                              : "bg-primary-soft text-primary"),
                        )}
                      >
                        <span className="tabular-nums">{formatTime(task.scheduledAt, timeZone)}</span> {task.title}
                      </Link>
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li>
                      <Link
                        href={buildHref(props.basePath, { de: day.date, ate: day.date, estado: "todas" })}
                        className="block px-1.5 text-xs font-medium text-muted-foreground hover:underline"
                      >
                        +{hidden} mais
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4 md:hidden">
        {agendaDays.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sem tarefas neste mês.
          </p>
        )}
        {agendaDays.map((day) => (
          <section key={day.date} aria-labelledby={`dia-${day.date}`}>
            <h3 id={`dia-${day.date}`} className="mb-2 text-sm font-semibold text-foreground first-letter:uppercase">
              {new Intl.DateTimeFormat("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              }).format(new Date(`${day.date}T12:00:00Z`))}
              {day.date === today && <span className="ml-2 text-primary">(hoje)</span>}
            </h3>
            <Card>
              <ul className="divide-y divide-border">
                {(byDay.get(day.date) ?? []).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tarefas/${task.id}`}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {formatTime(task.scheduledAt, timeZone)}
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
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}

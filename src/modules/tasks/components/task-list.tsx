import { ListTodo } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_TYPE_LABELS, isOverdue } from "../constants";
import type { TaskListItem } from "../queries";
import { InspectionResultBadge, OverdueBadge, TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

type TaskListProps = {
  tasks: TaskListItem[];
  timeZone: string;
  now: Date;
  /** Esconde a coluna da propriedade (ex.: na página de uma propriedade). */
  hideProperty?: boolean;
  empty?: { title: string; description?: ReactNode; action?: ReactNode };
};

/** Tabela em ecrãs grandes, cartões no telemóvel. Atrasadas e urgentes ficam destacadas. */
export function TaskList({ tasks, timeZone, now, hideProperty, empty }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title={empty?.title ?? "Sem tarefas"}
        description={empty?.description}
        action={empty?.action}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="data-table hidden md:table">
        <thead>
          <tr>
            <th scope="col">Tarefa</th>
            {!hideProperty && <th scope="col">Propriedade</th>}
            <th scope="col">Data</th>
            <th scope="col">Responsável</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task, now);
            return (
              <tr
                key={task.id}
                className={cn(
                  "relative",
                  (overdue || task.priority === "urgent") && "shadow-[inset_2px_0_0_var(--color-destructive)]",
                )}
              >
                <td>
                  <Link
                    href={`/tarefas/${task.id}`}
                    className="font-medium text-foreground underline-offset-4 after:absolute after:inset-0 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPE_LABELS[task.type]}
                    {task.checklist && ` · ${checklistLabel(task.checklist)}`}
                  </p>
                </td>
                {!hideProperty && <td className="text-muted-foreground">{task.property?.name ?? "—"}</td>}
                <td className="whitespace-nowrap tabular-nums">
                  {formatDate(task.scheduledAt, timeZone)}
                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                    {formatTime(task.scheduledAt, timeZone)}
                  </span>
                </td>
                <td className="text-muted-foreground">{task.assignee?.name ?? "Sem responsável"}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <TaskStatusBadge status={task.status} />
                    {task.inspectionResult && <InspectionResultBadge result={task.inspectionResult} />}
                    {overdue && <OverdueBadge />}
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {tasks.map((task) => {
          const overdue = isOverdue(task, now);
          return (
            <li key={task.id}>
              <Link
                href={`/tarefas/${task.id}`}
                className={cn(
                  "block space-y-1.5 px-4 py-3.5 transition-colors hover:bg-muted/50",
                  (overdue || task.priority === "urgent") && "shadow-[inset_2px_0_0_var(--color-destructive)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatDate(task.scheduledAt, timeZone).slice(0, 5)} {formatTime(task.scheduledAt, timeZone)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {TASK_TYPE_LABELS[task.type]}
                  {task.checklist && ` · ${checklistLabel(task.checklist)}`}
                  {!hideProperty && task.property && ` · ${task.property.name}`}
                  {` · ${task.assignee?.name ?? "Sem responsável"}`}
                </p>
                <div className="flex flex-wrap gap-1">
                  <TaskStatusBadge status={task.status} />
                  {task.inspectionResult && <InspectionResultBadge result={task.inspectionResult} />}
                  {overdue && <OverdueBadge />}
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function checklistLabel({ done, total }: { done: number; total: number }) {
  return `lista ${done}/${total}`;
}

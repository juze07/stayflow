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
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Tarefa
            </th>
            {!hideProperty && (
              <th scope="col" className="px-4 py-3 font-medium">
                Propriedade
              </th>
            )}
            <th scope="col" className="px-4 py-3 font-medium">
              Data
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Responsável
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => {
            const overdue = isOverdue(task, now);
            return (
              <tr
                key={task.id}
                className={cn("hover:bg-muted/40", (overdue || task.priority === "urgent") && "bg-destructive-soft/40")}
              >
                <td className="px-4 py-3">
                  <Link href={`/tarefas/${task.id}`} className="font-medium text-foreground hover:underline">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPE_LABELS[task.type]}
                    {task.checklist && ` · ${checklistLabel(task.checklist)}`}
                  </p>
                </td>
                {!hideProperty && <td className="px-4 py-3 text-muted-foreground">{task.property?.name ?? "—"}</td>}
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {formatDate(task.scheduledAt, timeZone)}
                  <span className="ml-1 text-muted-foreground">{formatTime(task.scheduledAt, timeZone)}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{task.assignee?.name ?? "Sem responsável"}</td>
                <td className="px-4 py-3">
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
                  "block space-y-1.5 px-4 py-3 hover:bg-muted/40",
                  (overdue || task.priority === "urgent") && "bg-destructive-soft/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
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

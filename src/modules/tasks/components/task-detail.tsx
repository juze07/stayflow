import { ArrowLeft, Building2, CalendarClock, Clock, Pencil, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TASK_PRIORITY_LABELS, TASK_TYPE_LABELS, isOverdue } from "../constants";
import { getTask } from "../queries";
import { DeleteTaskButton } from "./delete-task-button";
import { OverdueBadge, TaskPriorityBadge, TaskStatusBadge } from "./task-badges";
import { TaskNotesForm } from "./task-notes-form";
import { TaskStatusActions } from "./task-status-actions";

export async function TaskDetailView({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role, user }, { id }] = await Promise.all([requireBusiness(), params]);
  const task = await getTask(business.id, id);
  const tz = business.timezone;
  const canManage = canManageOperations(role);
  const isAssignee = task.assignee?.id === user.id;
  const canUpdate = canManage || isAssignee;
  const overdue = isOverdue(task, requestTime());

  return (
    <div className="space-y-6">
      <Link
        href="/tarefas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tarefas
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{TASK_TYPE_LABELS[task.type]}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{task.title}</h1>
          <div className="flex flex-wrap gap-1">
            <TaskStatusBadge status={task.status} />
            {overdue && <OverdueBadge />}
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/tarefas/${task.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            <DeleteTaskButton taskId={task.id} title={task.title} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUpdate ? (
                <TaskStatusActions taskId={task.id} status={task.status} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Só o responsável pela tarefa e os gestores podem alterar o estado.
                </p>
              )}
              {(task.type === "cleaning" || task.type === "inspection") && (
                <Alert tone="info">
                  {task.type === "inspection"
                    ? "A lista de verificação e o resultado da inspeção chegam na Fase 4. Até lá, uma inspeção não pode ser marcada como concluída."
                    : "A lista de verificação da limpeza chega na Fase 4."}
                </Alert>
              )}
            </CardContent>
          </Card>

          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line text-foreground">{task.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Notas de execução</CardTitle>
            </CardHeader>
            <CardContent>
              {canUpdate ? (
                <TaskNotesForm taskId={task.id} notes={task.notes} />
              ) : (
                <p className="text-sm whitespace-pre-line text-muted-foreground">{task.notes || "Sem notas."}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Detail icon={<Building2 />} label="Propriedade">
                {task.property ? (
                  <Link href={`/propriedades/${task.property.id}`} className="font-medium text-primary hover:underline">
                    {task.property.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail icon={<CalendarClock />} label="Marcada para">
                {formatDateTime(task.scheduledAt, tz)}
              </Detail>
              <Detail icon={<Clock />} label="Duração prevista">
                {task.estimatedMinutes ? `${task.estimatedMinutes} min` : "Por definir"}
              </Detail>
              <Detail icon={<User />} label="Responsável">
                {task.assignee ? `${task.assignee.name}${isAssignee ? " (você)" : ""}` : "Sem responsável"}
              </Detail>
              <Detail label="Prioridade">{TASK_PRIORITY_LABELS[task.priority]}</Detail>
              {task.startedAt && <Detail label="Iniciada">{formatDateTime(task.startedAt, tz)}</Detail>}
              {task.completedAt && (
                <Detail label="Concluída">
                  {formatDateTime(task.completedAt, tz)}
                  {task.completedBy && ` por ${task.completedBy}`}
                </Detail>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ icon, label, children }: { icon?: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4" aria-hidden>
        {icon ?? <span className="block size-4" />}
      </span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-foreground">{children}</dd>
      </div>
    </div>
  );
}

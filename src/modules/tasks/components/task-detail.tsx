import { ArrowLeft, Building2, CalendarClock, Clock, Pencil, User, Wrench } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import {
  INSPECTION_RESULT_LABELS,
  INSPECTION_RESULT_TONES,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  isOverdue,
} from "../constants";
import { getTask } from "../queries";
import { DeleteTaskButton } from "./delete-task-button";
import { InspectionForm } from "./inspection-form";
import { OverdueBadge, TaskPriorityBadge, TaskStatusBadge } from "./task-badges";
import { TaskChecklist } from "./task-checklist";
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
  const isOpen = task.status !== "completed" && task.status !== "cancelled";
  const back =
    task.type === "cleaning"
      ? { href: "/limpezas", label: "Limpezas" }
      : task.type === "inspection"
        ? { href: "/inspecoes", label: "Inspeções" }
        : { href: "/tarefas", label: "Tarefas" };

  return (
    <div className="space-y-6">
      <Link
        href={back.href}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {back.label}
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
            </CardContent>
          </Card>

          {task.checklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de verificação</CardTitle>
                {task.checklistTemplateName && (
                  <p className="text-sm text-muted-foreground">Modelo: {task.checklistTemplateName}</p>
                )}
              </CardHeader>
              <CardContent>
                <TaskChecklist items={task.checklistItems} editable={canUpdate && isOpen} timeZone={tz} />
              </CardContent>
            </Card>
          )}

          {task.inspection && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da inspeção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canUpdate && isOpen ? (
                  <InspectionForm
                    taskId={task.id}
                    result={task.inspection.result}
                    observations={task.inspection.observations}
                  />
                ) : (
                  <div className="space-y-2 text-sm">
                    {task.inspection.result ? (
                      <Badge tone={INSPECTION_RESULT_TONES[task.inspection.result]}>
                        {INSPECTION_RESULT_LABELS[task.inspection.result]}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">Resultado ainda não registado.</p>
                    )}
                    {task.inspection.observations && (
                      <p className="whitespace-pre-line text-foreground">{task.inspection.observations}</p>
                    )}
                  </div>
                )}
                {task.inspection.result && task.inspection.result !== "approved" && (
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/manutencao/novo?inspecao=${task.id}`}>
                      <Wrench aria-hidden />
                      Reportar problema de manutenção
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

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
              {task.maintenanceIssue && (
                <Detail icon={<Wrench />} label="Problema de manutenção">
                  <Link
                    href={`/manutencao/${task.maintenanceIssue.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {task.maintenanceIssue.title}
                  </Link>
                </Detail>
              )}
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

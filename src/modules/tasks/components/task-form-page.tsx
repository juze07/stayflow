import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { splitZonedDateTime } from "@/lib/dates";
import { requestTime } from "@/lib/now";
import { getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TIMEZONES } from "@/modules/business/schemas";
import { listPropertyOptions } from "@/modules/properties/queries";
import { getTask, listAssigneeOptions } from "../queries";
import type { TaskInput } from "../schemas";
import { TaskForm } from "./task-form";

function timeZoneLabel(timeZone: string) {
  const known = TIMEZONES.find((tz) => tz.value === timeZone);
  return `Hora de ${known?.label ?? timeZone}`;
}

export async function NewTaskForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) redirect("/tarefas");

  const [properties, assignees] = await Promise.all([
    listPropertyOptions(business.id),
    listAssigneeOptions(business.id),
  ]);

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Registe primeiro uma propriedade"
        description="Cada tarefa pertence a uma propriedade ativa."
        action={
          <Button asChild>
            <Link href="/propriedades/nova">Registar propriedade</Link>
          </Button>
        }
      />
    );
  }

  const requested = getParam(params, "propriedade");
  const propertyId = properties.some((p) => p.id === requested)
    ? requested!
    : properties.length === 1
      ? properties[0].id
      : "";
  // Por defeito: amanhã às 11:00, a hora habitual de check-out.
  const tomorrow = new Date(requestTime().getTime() + 86_400_000);

  const defaults: TaskInput = {
    propertyId,
    type: "cleaning",
    title: "",
    description: "",
    date: splitZonedDateTime(tomorrow, business.timezone).date,
    time: "11:00",
    estimatedMinutes: null,
    assigneeId: "",
    priority: "normal",
  };

  return (
    <TaskForm
      defaultValues={defaults}
      properties={properties}
      assignees={assignees}
      timeZoneLabel={timeZoneLabel(business.timezone)}
      cancelHref={propertyId && requested ? `/propriedades/${propertyId}` : "/tarefas"}
    />
  );
}

export async function EditTaskForm({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) redirect(`/tarefas/${id}`);

  const [task, properties, assignees] = await Promise.all([
    getTask(business.id, id),
    listPropertyOptions(business.id, { includeArchived: true }),
    listAssigneeOptions(business.id),
  ]);
  const { date, time } = splitZonedDateTime(task.scheduledAt, business.timezone);

  // Uma propriedade arquivada só aparece se for a atual (não se pode mudar para ela).
  const propertyOptions = properties
    .filter((p) => !p.archived || p.id === task.property?.id)
    .map((p) => ({ id: p.id, name: p.archived ? `${p.name} (arquivada)` : p.name }));
  // Um responsável que saiu da equipa continua visível até ser trocado.
  const assigneeOptions =
    task.assignee && !assignees.some((a) => a.id === task.assignee!.id) ? [...assignees, task.assignee] : assignees;

  return (
    <TaskForm
      taskId={task.id}
      defaultValues={{
        propertyId: task.property?.id ?? "",
        type: task.type,
        title: task.title,
        description: task.description ?? "",
        date,
        time,
        estimatedMinutes: task.estimatedMinutes,
        assigneeId: task.assignee?.id ?? "",
        priority: task.priority,
      }}
      properties={propertyOptions}
      assignees={assigneeOptions}
      timeZoneLabel={timeZoneLabel(business.timezone)}
      cancelHref={`/tarefas/${task.id}`}
    />
  );
}

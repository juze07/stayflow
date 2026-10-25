import { Building2 } from "@/components/ui/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { splitZonedDateTime } from "@/lib/dates";
import { requestTime } from "@/lib/now";
import { getEnumParam, getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TIMEZONES } from "@/modules/business/schemas";
import { listTemplateOptions } from "@/modules/checklists/queries";
import { getMaintenanceIssueOption } from "@/modules/maintenance/queries";
import { listPropertyOptions } from "@/modules/properties/queries";
import { TASK_TYPES } from "../constants";
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

  const [properties, assignees, templates, issue] = await Promise.all([
    listPropertyOptions(business.id),
    listAssigneeOptions(business.id),
    listTemplateOptions(business.id),
    getMaintenanceIssueOption(business.id, getParam(params, "problema")),
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

  // Ao agendar a reparação de um problema, a propriedade é a do problema.
  const requested = issue?.propertyId ?? getParam(params, "propriedade");
  const propertyId = properties.some((p) => p.id === requested)
    ? requested!
    : properties.length === 1
      ? properties[0].id
      : "";
  // Por defeito: amanhã às 11:00, a hora habitual de check-out.
  const tomorrow = new Date(requestTime().getTime() + 86_400_000);

  const type = issue ? "maintenance" : (getEnumParam(params, "tipo", TASK_TYPES) ?? "cleaning");
  const defaults: TaskInput = {
    propertyId,
    type,
    title: issue ? `Reparar: ${issue.title}`.slice(0, 160) : "",
    description: "",
    date: splitZonedDateTime(tomorrow, business.timezone).date,
    time: "11:00",
    estimatedMinutes: null,
    assigneeId: "",
    priority: issue?.priority ?? "normal",
    checklistTemplateId: templates.find((template) => template.kind === type)?.id ?? "",
    maintenanceIssueId: issue?.id ?? "",
  };

  return (
    <TaskForm
      defaultValues={defaults}
      properties={issue ? properties.filter((p) => p.id === issue.propertyId) : properties}
      assignees={assignees}
      templates={templates}
      maintenanceIssue={issue ? { id: issue.id, name: issue.title } : null}
      timeZoneLabel={timeZoneLabel(business.timezone)}
      cancelHref={
        issue
          ? `/manutencao/${issue.id}`
          : propertyId && requested
            ? `/propriedades/${propertyId}`
            : getParam(params, "tipo") === "cleaning"
              ? "/limpezas"
              : getParam(params, "tipo") === "inspection"
                ? "/inspecoes"
                : "/tarefas"
      }
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
        checklistTemplateId: "",
        maintenanceIssueId: "",
      }}
      typeLocked={task.type === "cleaning" || task.type === "inspection"}
      maintenanceIssue={
        task.maintenanceIssue ? { id: task.maintenanceIssue.id, name: task.maintenanceIssue.title } : null
      }
      properties={propertyOptions}
      assignees={assigneeOptions}
      timeZoneLabel={timeZoneLabel(business.timezone)}
      cancelHref={`/tarefas/${task.id}`}
    />
  );
}

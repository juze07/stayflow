import { Building2 } from "@/components/ui/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentsInput } from "@/lib/format";
import { getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { listAssigneeOptions } from "@/modules/tasks/queries";
import { getInspectionSource, getIssue } from "../queries";
import { IssueForm } from "./issue-form";

export async function NewIssueForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  const canManage = canManageOperations(role);

  const [properties, assignees, inspection] = await Promise.all([
    listPropertyOptions(business.id),
    canManage ? listAssigneeOptions(business.id) : Promise.resolve([]),
    getInspectionSource(business.id, getParam(params, "inspecao")),
  ]);

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Ainda não há propriedades"
        description="Os problemas são reportados numa propriedade ativa."
        action={
          canManage ? (
            <Button asChild>
              <Link href="/propriedades/nova">Registar propriedade</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  const requested = inspection?.propertyId ?? getParam(params, "propriedade");
  const propertyId = properties.some((p) => p.id === requested)
    ? requested!
    : properties.length === 1
      ? properties[0].id
      : "";

  return (
    <IssueForm
      canManage={canManage}
      properties={inspection ? properties.filter((p) => p.id === inspection.propertyId) : properties}
      assignees={assignees}
      sourceInspectionTitle={inspection?.taskTitle}
      cancelHref={inspection ? `/tarefas/${inspection.taskId}` : "/manutencao"}
      defaultValues={{
        propertyId,
        title: "",
        description: inspection?.observations ?? "",
        category: "other",
        priority: "normal",
        assigneeId: "",
        estimatedCost: "",
        sourceInspectionId: inspection?.inspectionId ?? "",
      }}
    />
  );
}

export async function EditIssueForm({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) redirect(`/manutencao/${id}`);

  const [issue, properties, assignees] = await Promise.all([
    getIssue(business.id, id),
    listPropertyOptions(business.id, { includeArchived: true }),
    listAssigneeOptions(business.id),
  ]);
  const assigneeOptions =
    issue.assignee && !assignees.some((a) => a.id === issue.assignee!.id) ? [...assignees, issue.assignee] : assignees;

  return (
    <IssueForm
      issueId={issue.id}
      canManage
      properties={properties
        .filter((p) => !p.archived || p.id === issue.property?.id)
        .map((p) => ({ id: p.id, name: p.archived ? `${p.name} (arquivada)` : p.name }))}
      assignees={assigneeOptions}
      cancelHref={`/manutencao/${issue.id}`}
      defaultValues={{
        propertyId: issue.property?.id ?? "",
        title: issue.title,
        description: issue.description ?? "",
        category: issue.category,
        priority: issue.priority,
        assigneeId: issue.assignee?.id ?? "",
        estimatedCost: formatCentsInput(issue.estimatedCostCents),
        sourceInspectionId: "",
      }}
    />
  );
}

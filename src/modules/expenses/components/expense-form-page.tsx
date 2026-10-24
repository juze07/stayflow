import { getParam, type SearchParams } from "@/lib/search-params";
import { zonedToday } from "@/lib/dates";
import { formatCentsInput } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { getExpense, listIssueOptions } from "../queries";
import { ExpenseForm } from "./expense-form";
import { ManagersOnly } from "./managers-only";

export async function NewExpenseForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <ManagersOnly />;

  const [properties, issues] = await Promise.all([listPropertyOptions(business.id), listIssueOptions(business.id)]);

  // Ao registar a partir de um problema, a despesa fica ligada a ele e à sua propriedade.
  const issue = issues.find((i) => i.id === getParam(params, "problema"));
  const requestedProperty = issue?.propertyId ?? getParam(params, "propriedade");
  const propertyId = properties.some((p) => p.id === requestedProperty) ? requestedProperty! : "";

  return (
    <ExpenseForm
      properties={properties}
      issues={issues}
      cancelHref={issue ? `/manutencao/${issue.id}` : propertyId ? `/propriedades/${propertyId}` : "/despesas"}
      defaultValues={{
        description: issue ? `Reparação: ${issue.name}`.slice(0, 200) : "",
        category: issue ? "maintenance" : "supplies",
        amount: "",
        incurredOn: zonedToday(business.timezone, requestTime()),
        propertyId,
        maintenanceIssueId: issue && propertyId === issue.propertyId ? issue.id : "",
        supplier: "",
        notes: "",
      }}
    />
  );
}

export async function EditExpenseForm({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) return <ManagersOnly />;

  const [expense, properties, issues] = await Promise.all([
    getExpense(business.id, id),
    listPropertyOptions(business.id, { includeArchived: true }),
    listIssueOptions(business.id),
  ]);
  const linkedIssue = expense.maintenanceIssue;
  const issueOptions =
    linkedIssue && !issues.some((i) => i.id === linkedIssue.id)
      ? [...issues, { id: linkedIssue.id, name: linkedIssue.title, propertyId: expense.property?.id ?? "" }]
      : issues;

  return (
    <ExpenseForm
      expenseId={expense.id}
      properties={properties
        .filter((p) => !p.archived || p.id === expense.property?.id)
        .map((p) => ({ id: p.id, name: p.archived ? `${p.name} (arquivada)` : p.name }))}
      issues={issueOptions}
      cancelHref={`/despesas/${expense.id}`}
      defaultValues={{
        description: expense.description,
        category: expense.category,
        amount: formatCentsInput(expense.amountCents),
        incurredOn: expense.incurredOn,
        propertyId: expense.property?.id ?? "",
        maintenanceIssueId: expense.maintenanceIssue?.id ?? "",
        supplier: expense.supplier ?? "",
        notes: expense.notes ?? "",
      }}
    />
  );
}

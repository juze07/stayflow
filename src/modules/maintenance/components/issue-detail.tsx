import { ArrowLeft, Building2, CalendarClock, ClipboardCheck, Pencil, Plus, Tag, User } from "@/components/ui/icons";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCentsInput, formatCurrency, formatDateTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { AttachmentsSection } from "@/modules/attachments/components/attachments-section";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TaskPriorityBadge } from "@/modules/tasks/components/task-badges";
import { TaskList } from "@/modules/tasks/components/task-list";
import { TASK_PRIORITY_LABELS } from "@/modules/tasks/constants";
import { listTasks } from "@/modules/tasks/queries";
import { ExpenseList } from "@/modules/expenses/components/expense-list";
import { listIssueExpenses } from "@/modules/expenses/queries";
import { ISSUE_CATEGORY_LABELS } from "../constants";
import { getIssue } from "../queries";
import { DeleteIssueButton } from "./delete-issue-button";
import { FinalCostForm } from "./final-cost-form";
import { IssueStatusBadge } from "./issue-badges";
import { IssueStatusActions } from "./issue-status-actions";

export async function IssueDetailView({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role, user }, { id }] = await Promise.all([requireBusiness(), params]);
  const issue = await getIssue(business.id, id);
  const now = requestTime();
  const tz = business.timezone;
  const canManage = canManageOperations(role);
  const isAssignee = issue.assignee?.id === user.id;
  const canUpdate = canManage || isAssignee;
  const isReporter = issue.reportedById === user.id;
  const [tasks, expenses] = await Promise.all([
    listTasks({ businessId: business.id, maintenanceIssueId: issue.id, status: "todas", page: 1 }, now),
    canManage ? listIssueExpenses(business.id, issue.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/manutencao"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Manutenção
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{ISSUE_CATEGORY_LABELS[issue.category]}</p>
          <h1 className="font-display text-[32px] leading-tight text-foreground sm:text-4xl">{issue.title}</h1>
          <div className="flex flex-wrap gap-1">
            <IssueStatusBadge status={issue.status} />
            <TaskPriorityBadge priority={issue.priority} />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/manutencao/${issue.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            <DeleteIssueButton issueId={issue.id} title={issue.title} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {canUpdate ? (
                <IssueStatusActions issueId={issue.id} status={issue.status} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Só o responsável pelo problema e os gestores podem alterar o estado.
                </p>
              )}
            </CardContent>
          </Card>

          {issue.description && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line text-foreground">{issue.description}</p>
              </CardContent>
            </Card>
          )}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Tarefas de reparação</h2>
                <p className="text-sm text-muted-foreground">Visitas e trabalhos agendados para resolver o problema.</p>
              </div>
              {canManage && issue.status !== "resolved" && issue.status !== "cancelled" && (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/tarefas/nova?problema=${issue.id}`}>
                    <Plus aria-hidden />
                    Agendar tarefa
                  </Link>
                </Button>
              )}
            </div>
            <TaskList
              tasks={tasks.items}
              timeZone={tz}
              now={now}
              hideProperty
              empty={{ title: "Ainda não há tarefas para este problema" }}
            />
          </section>

          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <AttachmentsSection
              businessId={business.id}
              timeZone={tz}
              parent={{ type: "maintenance_issue", id: issue.id }}
              title="Fotografias"
              description="O estado antes e depois da reparação."
              canUpload={canUpdate || isReporter}
              canManage={canManage}
              userId={user.id}
            />
          </Suspense>

          {canManage && (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Despesas</h2>
                  <p className="text-sm text-muted-foreground">Custos registados para este problema.</p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/despesas/nova?problema=${issue.id}`}>
                    <Plus aria-hidden />
                    Registar despesa
                  </Link>
                </Button>
              </div>
              <ExpenseList expenses={expenses} hideProperty empty={{ title: "Sem despesas registadas" }} />
            </section>
          )}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-5">
            <dl className="space-y-4 text-sm">
              <Detail icon={<Building2 />} label="Propriedade">
                {issue.property ? (
                  <Link
                    href={`/propriedades/${issue.property.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {issue.property.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail icon={<CalendarClock />} label="Reportado">
                {formatDateTime(issue.reportedAt, tz)}
                {issue.reportedBy && ` por ${issue.reportedBy}`}
              </Detail>
              {issue.stay && (
                <Detail label="Estadia">
                  <Link href={`/estadias/${issue.stay.id}`} className="font-medium text-primary hover:underline">
                    {issue.stay.guestName}
                  </Link>
                </Detail>
              )}
              {issue.resolvedAt && <Detail label="Resolvido">{formatDateTime(issue.resolvedAt, tz)}</Detail>}
              <Detail icon={<User />} label="Responsável">
                {issue.assignee ? `${issue.assignee.name}${isAssignee ? " (você)" : ""}` : "Sem responsável"}
              </Detail>
              <Detail icon={<Tag />} label="Prioridade">
                {TASK_PRIORITY_LABELS[issue.priority]}
              </Detail>
              {issue.sourceInspection && (
                <Detail icon={<ClipboardCheck />} label="Encontrado na inspeção">
                  <Link
                    href={`/tarefas/${issue.sourceInspection.taskId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {issue.sourceInspection.taskTitle}
                  </Link>
                </Detail>
              )}
              <Detail label="Custo estimado">
                {issue.estimatedCostCents === null ? "Por definir" : formatCurrency(issue.estimatedCostCents)}
              </Detail>
              {!canUpdate && (
                <Detail label="Custo final">
                  {issue.finalCostCents === null ? "Por definir" : formatCurrency(issue.finalCostCents)}
                </Detail>
              )}
            </dl>
            {canUpdate && <FinalCostForm issueId={issue.id} initialValue={formatCentsInput(issue.finalCostCents)} />}
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

import { ArrowLeft, Bath, BedDouble, MapPin, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TaskList } from "@/modules/tasks/components/task-list";
import { IssueStatusBadge } from "@/modules/maintenance/components/issue-badges";
import { listPropertyIssues } from "@/modules/maintenance/queries";
import { InspectionResultBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";
import { listTasks } from "@/modules/tasks/queries";
import { getProperty, listPropertyExpenses } from "../queries";
import { ArchivePropertyButton } from "./archive-property-button";

export async function PropertyDetailView({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  const property = await getProperty(business.id, id);
  const canManage = canManageOperations(role);
  const tz = business.timezone;
  const now = requestTime();

  const [upcoming, cleanings, inspections, maintenance, expenses] = await Promise.all([
    listTasks({ businessId: business.id, propertyId: property.id, status: "abertas", page: 1 }, now),
    listTasks(
      { businessId: business.id, propertyId: property.id, type: "cleaning", status: "completed", page: 1 },
      now,
    ),
    listTasks({ businessId: business.id, propertyId: property.id, type: "inspection", status: "todas", page: 1 }, now),
    listPropertyIssues(business.id, property.id),
    canManage ? listPropertyExpenses(business.id, property.id) : Promise.resolve([]),
  ]);

  const tasksHref = `/tarefas?propriedade=${property.id}`;
  const archived = Boolean(property.archivedAt);

  return (
    <div className="space-y-6">
      <Link
        href="/propriedades"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Propriedades
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {property.name}
            {archived && <Badge className="ml-2 align-middle">Arquivada</Badge>}
          </h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {property.addressLine}, {property.postalCode} {property.city}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-start gap-2">
            {!archived && (
              <Button asChild>
                <Link href={`/tarefas/nova?propriedade=${property.id}`}>
                  <Plus aria-hidden />
                  Nova tarefa
                </Link>
              </Button>
            )}
            <Button variant="secondary" asChild>
              <Link href={`/propriedades/${property.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            <ArchivePropertyButton propertyId={property.id} propertyName={property.name} archived={archived} />
          </div>
        )}
      </div>

      {archived && (
        <Alert tone="warning">
          Arquivada em {formatDate(property.archivedAt!, tz)}. O histórico mantém-se, mas não é possível criar tarefas
          novas.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section
            title="Próximas tarefas"
            description="Por iniciar ou em curso."
            action={upcoming.total > upcoming.items.length ? <SeeAll href={tasksHref} total={upcoming.total} /> : null}
          >
            <TaskList
              tasks={upcoming.items}
              timeZone={tz}
              now={now}
              hideProperty
              empty={{ title: "Sem tarefas por fazer nesta propriedade" }}
            />
          </Section>

          <Section
            title="Histórico de limpezas"
            description="Limpezas concluídas, das mais recentes para as mais antigas."
          >
            <SimpleList
              empty="Ainda não há limpezas concluídas."
              items={cleanings.items.slice(0, 10).map((task) => ({
                id: task.id,
                href: `/tarefas/${task.id}`,
                title: task.title,
                meta: `${formatDateTime(task.completedAt ?? task.scheduledAt, tz)} · ${task.assignee?.name ?? "Sem responsável"}`,
              }))}
            />
          </Section>

          <Section title="Inspeções" description="As mais recentes, com o resultado registado.">
            <SimpleList
              empty="Ainda não há inspeções."
              items={inspections.items.slice(0, 10).map((task) => ({
                id: task.id,
                href: `/tarefas/${task.id}`,
                title: task.title,
                meta: formatDateTime(task.scheduledAt, tz),
                badge: task.inspectionResult ? (
                  <InspectionResultBadge result={task.inspectionResult} />
                ) : (
                  <TaskStatusBadge status={task.status} />
                ),
              }))}
            />
          </Section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Fact icon={<BedDouble />} label="Quartos" value={property.bedrooms} />
                <Fact icon={<Bath />} label="Casas de banho" value={property.bathrooms} />
                <Fact icon={<Users />} label="Hóspedes" value={property.maxGuests} />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">Instruções de acesso</h2>
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                  {property.accessInstructions || "Sem instruções registadas."}
                </p>
              </div>
              {canManage && (
                <div>
                  <h2 className="text-sm font-medium text-foreground">Notas internas</h2>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                    {property.internalNotes || "Sem notas."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Section
            title="Manutenção"
            description="Problemas reportados nesta propriedade."
            action={
              <Link
                href={`/manutencao?propriedade=${property.id}&estado=todos`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            }
          >
            <SimpleList
              empty="Sem problemas registados."
              items={maintenance.map((issue) => ({
                id: issue.id,
                href: `/manutencao/${issue.id}`,
                title: issue.title,
                meta: formatDate(issue.reportedAt, tz),
                badge: <IssueStatusBadge status={issue.status} />,
              }))}
            />
            {!archived && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/manutencao/novo?propriedade=${property.id}`}>
                  <Plus aria-hidden />
                  Reportar problema
                </Link>
              </Button>
            )}
          </Section>

          {canManage && (
            <Section title="Despesas" description="Últimas despesas registadas nesta propriedade.">
              <SimpleList
                empty="Sem despesas registadas."
                items={expenses.map((expense) => ({
                  id: expense.id,
                  href: `/despesas/${expense.id}`,
                  title: expense.description,
                  meta: formatDate(expense.incurredOn, "UTC"),
                  badge: (
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(expense.amountCents)}</span>
                  ),
                }))}
              />
              <div className="flex flex-wrap gap-2">
                {!archived && (
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/despesas/nova?propriedade=${property.id}`}>
                      <Plus aria-hidden />
                      Registar despesa
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/despesas?propriedade=${property.id}`}>Ver todas</Link>
                </Button>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href, total }: { href: string; total: number }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary hover:underline">
      Ver todas ({total})
    </Link>
  );
}

type SimpleItem = { id: string; title: string; meta: string; href?: string; badge?: ReactNode };

function SimpleList({ items, empty }: { items: SimpleItem[]; empty: string }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <Card>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const content = (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
              </div>
              {item.badge}
            </div>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="block transition-colors hover:bg-muted/50">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/60 p-2">
      <span className="mx-auto block w-fit text-muted-foreground [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

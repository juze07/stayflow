import { ArrowLeft, Building2, CalendarDays, Pencil, Store, Tag, Wrench } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { AttachmentsSection } from "@/modules/attachments/components/attachments-section";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { EXPENSE_CATEGORY_LABELS } from "../constants";
import { getExpense } from "../queries";
import { DeleteExpenseButton } from "./delete-expense-button";
import { ManagersOnly } from "./managers-only";

export async function ExpenseDetailView({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role, user }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) return <ManagersOnly />;
  const expense = await getExpense(business.id, id);
  const tz = business.timezone;

  return (
    <div className="space-y-6">
      <Link
        href="/despesas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Despesas
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{EXPENSE_CATEGORY_LABELS[expense.category]}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{expense.description}</h1>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{formatCurrency(expense.amountCents)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href={`/despesas/${expense.id}/editar`}>
              <Pencil aria-hidden />
              Editar
            </Link>
          </Button>
          <DeleteExpenseButton expenseId={expense.id} description={expense.description} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <AttachmentsSection
              businessId={business.id}
              timeZone={tz}
              parent={{ type: "expense", id: expense.id }}
              title="Comprovativos"
              description="Fatura, recibo ou talão. Fotografe com o telemóvel ou anexe um PDF."
              canUpload
              canManage
              userId={user.id}
              receipts
            />
          </Suspense>

          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line text-foreground">{expense.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Detail icon={<CalendarDays />} label="Data">
                {formatDate(expense.incurredOn, "UTC")}
              </Detail>
              <Detail icon={<Building2 />} label="Propriedade">
                {expense.property ? (
                  <Link
                    href={`/propriedades/${expense.property.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {expense.property.name}
                  </Link>
                ) : (
                  "Geral (sem propriedade)"
                )}
              </Detail>
              <Detail icon={<Tag />} label="Categoria">
                {EXPENSE_CATEGORY_LABELS[expense.category]}
              </Detail>
              {expense.supplier && (
                <Detail icon={<Store />} label="Fornecedor">
                  {expense.supplier}
                </Detail>
              )}
              {expense.maintenanceIssue && (
                <Detail icon={<Wrench />} label="Problema de manutenção">
                  <Link
                    href={`/manutencao/${expense.maintenanceIssue.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {expense.maintenanceIssue.title}
                  </Link>
                </Detail>
              )}
              <Detail label="Registada">
                {formatDateTime(expense.createdAt, tz)}
                {expense.createdBy && ` por ${expense.createdBy}`}
              </Detail>
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

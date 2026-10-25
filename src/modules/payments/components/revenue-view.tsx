import { AlertTriangle, Receipt, TrendingUp, Wallet } from "@/components/ui/icons";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { zonedToday } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { getEnumParam, getParam, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { StatCard, StatGroup } from "@/modules/dashboard/components/stat-card";
import { REPORT_PERIOD_LABELS, REPORT_PERIODS } from "@/modules/expenses/constants";
import { resolveReportRange } from "@/modules/expenses/report";
import { listPropertyOptions } from "@/modules/properties/queries";
import { StaysManagersOnly } from "@/modules/stays/components/stays-only";
import { getOutstanding, getRevenueReportRows } from "../queries";
import { summarizeRevenue } from "../report";
import { RevenueExpenseChart } from "./revenue-chart";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function monthLabel(month: string) {
  return `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`;
}

function Money({ cents, signed }: { cents: number; signed?: boolean }) {
  return (
    <span
      className={cn("tabular-nums", signed && cents < 0 && "text-destructive", signed && cents > 0 && "text-success")}
    >
      {formatCurrency(cents)}
    </span>
  );
}

export async function RevenueView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const custom = { from: getParam(params, "de"), to: getParam(params, "ate") };
  const requested =
    custom.from && custom.to ? "personalizado" : (getEnumParam(params, "periodo", REPORT_PERIODS) ?? "12m");
  const now = requestTime();
  const range = resolveReportRange(requested, custom, business.timezone, now);
  const isCustom = range.period === "personalizado";
  const values = {
    periodo: isCustom || range.period === "12m" ? undefined : range.period,
    de: isCustom ? range.from : undefined,
    ate: isCustom ? range.to : undefined,
  };
  const today = zonedToday(business.timezone, now);

  const [rows, outstanding, properties] = await Promise.all([
    getRevenueReportRows(business.id, range),
    getOutstanding(business.id, today),
    listPropertyOptions(business.id, { includeArchived: true }),
  ]);
  const summary = summarizeRevenue(rows, range);
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const hasData = summary.revenueCents > 0 || summary.expenseCents > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receitas"
        description={`Receitas recebidas comparadas com as despesas. ${isCustom ? REPORT_PERIOD_LABELS.personalizado : REPORT_PERIOD_LABELS[range.period]}: ${formatDate(range.from, "UTC")} a ${formatDate(range.to, "UTC")}.`}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/receitas/pagamentos">Pagamentos</Link>
            </Button>
            <Button asChild>
              <Link href="/receitas/novo">Novo pagamento</Link>
            </Button>
          </>
        }
      />

      <FilterBar
        values={values}
        fields={[
          {
            type: "select",
            name: "periodo",
            label: "Período",
            allLabel: REPORT_PERIOD_LABELS["12m"],
            options: REPORT_PERIODS.filter((p) => p !== "12m" && p !== "personalizado").map((p) => ({
              value: p,
              label: REPORT_PERIOD_LABELS[p],
            })),
          },
          { type: "date", name: "de", label: "De" },
          { type: "date", name: "ate", label: "Até" },
        ]}
      />

      <StatGroup>
        <StatCard label="Receitas" value={formatCurrency(summary.revenueCents)} icon={Wallet} />
        <StatCard
          label="Despesas"
          value={formatCurrency(summary.expenseCents)}
          icon={Receipt}
          href="/despesas/relatorio"
        />
        <StatCard
          label="Resultado"
          value={formatCurrency(summary.profitCents)}
          icon={TrendingUp}
          tone={summary.profitCents < 0 ? "danger" : undefined}
          hint={summary.marginPercent !== null ? `Margem de ${summary.marginPercent}%` : undefined}
        />
        <StatCard
          label="Por receber"
          value={formatCurrency(outstanding.totalCents)}
          icon={AlertTriangle}
          tone={outstanding.overdueCount > 0 ? "danger" : undefined}
          hint={
            outstanding.overdueCount > 0
              ? `${formatCurrency(outstanding.overdueCents)} em atraso`
              : `${outstanding.count} pagamento${outstanding.count === 1 ? "" : "s"}`
          }
          href={outstanding.overdueCount > 0 ? "/receitas/pagamentos?estado=em-atraso" : "/receitas/pagamentos"}
        />
      </StatGroup>

      {outstanding.reportedCount > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              {outstanding.reportedCount === 1
                ? "1 inquilino indicou que já pagou."
                : `${outstanding.reportedCount} inquilinos indicaram que já pagaram.`}{" "}
              Confirme o recebimento.
            </p>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/receitas/pagamentos">Ver pagamentos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasData ? (
        <Card>
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sem receitas recebidas nem despesas neste período.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Por mês</CardTitle>
              <CardDescription>Receitas pela data de recebimento; despesas pela data da despesa.</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueExpenseChart
                data={summary.byMonth.map((m) => ({
                  label: monthLabel(m.key),
                  revenueCents: m.revenueCents,
                  expenseCents: m.expenseCents,
                }))}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Por propriedade</CardTitle>
              <CardDescription>Despesas gerais (sem propriedade) aparecem à parte.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="data-table mt-4 border-t border-border">
                <thead>
                  <tr>
                    <th scope="col">Propriedade</th>
                    <th scope="col" className="text-right">
                      Receitas
                    </th>
                    <th scope="col" className="text-right">
                      Despesas
                    </th>
                    <th scope="col" className="text-right">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byProperty.map((group) => (
                    <tr key={group.key ?? "geral"}>
                      <th scope="row" className="max-w-40 truncate px-4 py-3 text-left font-medium text-foreground">
                        {group.key ? (propertyNames.get(group.key) ?? "Propriedade removida") : "Geral"}
                      </th>
                      <td className="text-right">
                        <Money cents={group.revenueCents} />
                      </td>
                      <td className="text-right">
                        <Money cents={group.expenseCents} />
                      </td>
                      <td className="text-right">
                        <Money cents={group.profitCents} signed />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-surface-raised font-semibold text-foreground">
                  <tr>
                    <th scope="row" className="px-4 py-3 text-left">
                      Total
                    </th>
                    <td className="text-right">
                      <Money cents={summary.revenueCents} />
                    </td>
                    <td className="text-right">
                      <Money cents={summary.expenseCents} />
                    </td>
                    <td className="text-right">
                      <Money cents={summary.profitCents} signed />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

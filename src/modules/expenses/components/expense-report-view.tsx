import { ArrowLeft, CalendarRange, Receipt, Tag } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { buildHref, getEnumParam, getParam, type SearchParams } from "@/lib/search-params";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { EXPENSE_CATEGORY_LABELS, REPORT_PERIOD_LABELS, REPORT_PERIODS } from "../constants";
import { getExpenseReportRows } from "../queries";
import { resolveReportRange, summarizeReport, type ReportGroup } from "../report";
import { ManagersOnly } from "./managers-only";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function monthLabel(month: string) {
  return `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

export async function ExpenseReportView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <ManagersOnly />;

  const custom = { from: getParam(params, "de"), to: getParam(params, "ate") };
  const requested =
    custom.from && custom.to ? "personalizado" : (getEnumParam(params, "periodo", REPORT_PERIODS) ?? "mes");
  const range = resolveReportRange(requested, custom, business.timezone, requestTime());
  const isCustom = range.period === "personalizado";
  const values = {
    periodo: isCustom || range.period === "mes" ? undefined : range.period,
    de: isCustom ? range.from : undefined,
    ate: isCustom ? range.to : undefined,
  };

  const [rows, properties] = await Promise.all([
    getExpenseReportRows(business.id, range),
    listPropertyOptions(business.id, { includeArchived: true }),
  ]);
  const report = summarizeReport(rows, range);
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const listHref = (extra: Record<string, string | undefined>) =>
    buildHref("/despesas", { de: range.from, ate: range.to, ...extra });
  const months = report.byMonth.length;

  return (
    <div className="space-y-6">
      <Link
        href="/despesas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Despesas
      </Link>
      <PageHeader
        title="Relatório de despesas"
        description={`${isCustom ? REPORT_PERIOD_LABELS.personalizado : REPORT_PERIOD_LABELS[range.period]}: ${formatDate(range.from, "UTC")} a ${formatDate(range.to, "UTC")}`}
      />

      <FilterBar
        values={values}
        fields={[
          {
            type: "select",
            name: "periodo",
            label: "Período",
            allLabel: REPORT_PERIOD_LABELS.mes,
            options: REPORT_PERIODS.filter((p) => p !== "mes" && p !== "personalizado").map((p) => ({
              value: p,
              label: REPORT_PERIOD_LABELS[p],
            })),
          },
          { type: "date", name: "de", label: "De" },
          { type: "date", name: "ate", label: "Até" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total" value={formatCurrency(report.totalCents)} icon={Receipt} />
        <StatCard label="Despesas" value={report.count} icon={Tag} />
        {months > 1 && (
          <StatCard
            label="Média mensal"
            value={formatCurrency(Math.round(report.totalCents / months))}
            icon={CalendarRange}
          />
        )}
      </div>

      {report.count === 0 ? (
        <Card>
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">Sem despesas registadas neste período.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownCard
            title="Por propriedade"
            description="Despesas gerais aparecem sem propriedade."
            total={report.totalCents}
            items={report.byProperty.map((group) => ({
              ...group,
              label: group.key ? (propertyNames.get(group.key) ?? "Propriedade removida") : "Geral (sem propriedade)",
              href: listHref({ propriedade: group.key ?? "geral" }),
            }))}
          />
          <BreakdownCard
            title="Por categoria"
            total={report.totalCents}
            items={report.byCategory.map((group) => ({
              ...group,
              label: EXPENSE_CATEGORY_LABELS[group.key],
              href: listHref({ categoria: group.key }),
            }))}
          />
          {months > 1 && (
            <div className="lg:col-span-2">
              <BreakdownCard
                title="Por mês"
                total={Math.max(...report.byMonth.map((m) => m.totalCents))}
                items={report.byMonth.map((group) => ({ ...group, label: monthLabel(group.key) }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type BreakdownItem = ReportGroup<unknown> & { label: string; href?: string };

/** Lista com barras proporcionais: legível no telemóvel e acessível como texto. */
function BreakdownCard({
  title,
  description,
  total,
  items,
}: {
  title: string;
  description?: string;
  /** Valor que corresponde à barra cheia. */
  total: number;
  items: BreakdownItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => {
            const width = total > 0 ? Math.round((item.totalCents / total) * 100) : 0;
            const content = (
              <>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{item.label}</span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {formatCurrency(item.totalCents)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({item.count})</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted" aria-hidden>
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="block rounded-md hover:opacity-80">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

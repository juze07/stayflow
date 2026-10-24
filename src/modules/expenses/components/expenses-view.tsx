import { BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { isCalendarDate } from "@/lib/dates";
import { getEnumParam, getPage, getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "../constants";
import { listExpenses } from "../queries";
import { ExpenseList } from "./expense-list";
import { ManagersOnly } from "./managers-only";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dateParam(params: SearchParams, key: string) {
  const value = getParam(params, key);
  return value && isCalendarDate(value) ? value : undefined;
}

export async function ExpensesView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <ManagersOnly />;

  const propertyParam = getParam(params, "propriedade");
  const values = {
    q: getParam(params, "q"),
    propriedade:
      propertyParam === "geral" || (propertyParam && UUID_PATTERN.test(propertyParam)) ? propertyParam : undefined,
    categoria: getEnumParam(params, "categoria", EXPENSE_CATEGORIES),
    de: dateParam(params, "de"),
    ate: dateParam(params, "ate"),
  };
  const page = getPage(params);

  const [{ items, total, pageSize }, properties] = await Promise.all([
    listExpenses({
      businessId: business.id,
      search: values.q,
      propertyId: values.propriedade,
      category: values.categoria,
      from: values.de,
      to: values.ate,
      page,
    }),
    listPropertyOptions(business.id, { includeArchived: true }),
  ]);
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Controlo interno dos custos operacionais, com comprovativos."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/despesas/relatorio">
                <BarChart3 aria-hidden />
                Relatório
              </Link>
            </Button>
            <Button asChild>
              <Link href="/despesas/nova">
                <Plus aria-hidden />
                Nova despesa
              </Link>
            </Button>
          </>
        }
      />

      <FilterBar
        values={values}
        fields={[
          { type: "search", name: "q", label: "Pesquisar", placeholder: "Descrição ou fornecedor" },
          {
            type: "select",
            name: "propriedade",
            label: "Propriedade",
            allLabel: "Todas",
            options: [
              { value: "geral", label: "Geral (sem propriedade)" },
              ...properties.map((p) => ({ value: p.id, label: p.archived ? `${p.name} (arquivada)` : p.name })),
            ],
          },
          {
            type: "select",
            name: "categoria",
            label: "Categoria",
            allLabel: "Todas",
            options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] })),
          },
          { type: "date", name: "de", label: "De" },
          { type: "date", name: "ate", label: "Até" },
        ]}
      />

      <ExpenseList
        expenses={items}
        empty={
          hasFilters
            ? { title: "Nenhuma despesa encontrada", description: "Experimente alterar ou limpar os filtros." }
            : {
                title: "Ainda não há despesas",
                description: "Registe compras, serviços e reparações para acompanhar os custos por propriedade.",
                action: (
                  <Button asChild>
                    <Link href="/despesas/nova">Registar despesa</Link>
                  </Button>
                ),
              }
        }
      />
      <Pagination pathname="/despesas" params={values} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}

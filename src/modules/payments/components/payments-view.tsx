import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { zonedToday } from "@/lib/dates";
import { requestTime } from "@/lib/now";
import { getEnumParam, getPage, getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { StaysManagersOnly } from "@/modules/stays/components/stays-only";
import { PAYMENT_FILTER_LABELS, PAYMENT_FILTERS } from "../constants";
import { listPayments } from "../queries";
import { PaymentList } from "./payment-list";

export async function PaymentsView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const properties = await listPropertyOptions(business.id, { includeArchived: true });
  const propertyParam = getParam(params, "propriedade");
  const values = {
    q: getParam(params, "q"),
    propriedade: properties.some((p) => p.id === propertyParam) ? propertyParam : undefined,
    estado: getEnumParam(params, "estado", PAYMENT_FILTERS),
  };
  const page = getPage(params);
  const today = zonedToday(business.timezone, requestTime());

  const { items, total, pageSize } = await listPayments({
    businessId: business.id,
    today,
    search: values.q,
    propertyId: values.propriedade,
    status: values.estado ?? "por-receber",
    page,
  });
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="space-y-6">
      <Link
        href="/receitas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Receitas
      </Link>
      <PageHeader
        title="Pagamentos"
        description="Rendas, reservas e outros recebimentos. Os pagamentos de uma estadia aparecem no portal do inquilino."
        actions={
          <Button asChild>
            <Link href="/receitas/novo">
              <Plus aria-hidden />
              Novo pagamento
            </Link>
          </Button>
        }
      />

      <FilterBar
        values={values}
        fields={[
          { type: "search", name: "q", label: "Pesquisar", placeholder: "Descrição" },
          {
            type: "select",
            name: "propriedade",
            label: "Propriedade",
            allLabel: "Todas",
            options: properties.map((p) => ({ value: p.id, label: p.archived ? `${p.name} (arquivada)` : p.name })),
          },
          {
            type: "select",
            name: "estado",
            label: "Estado",
            allLabel: PAYMENT_FILTER_LABELS["por-receber"],
            options: PAYMENT_FILTERS.filter((f) => f !== "por-receber").map((f) => ({
              value: f,
              label: PAYMENT_FILTER_LABELS[f],
            })),
          },
        ]}
      />

      <PaymentList
        payments={items}
        today={today}
        empty={
          hasFilters
            ? { title: "Nenhum pagamento encontrado", description: "Experimente alterar ou limpar os filtros." }
            : {
                title: "Nada por receber",
                description: "Registe rendas e reservas para acompanhar o que falta receber e as receitas.",
                action: (
                  <Button asChild>
                    <Link href="/receitas/novo">Registar pagamento</Link>
                  </Button>
                ),
              }
        }
      />
      <Pagination pathname="/receitas/pagamentos" params={values} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}

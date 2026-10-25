import { Plus } from "@/components/ui/icons";
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
import { STAY_FILTER_LABELS, STAY_FILTERS } from "../constants";
import { listStays } from "../queries";
import { StayList } from "./stay-list";
import { StaysManagersOnly } from "./stays-only";

export async function StaysView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const properties = await listPropertyOptions(business.id, { includeArchived: true });
  const propertyParam = getParam(params, "propriedade");
  const values = {
    q: getParam(params, "q"),
    propriedade: properties.some((p) => p.id === propertyParam) ? propertyParam : undefined,
    estado: getEnumParam(params, "estado", STAY_FILTERS),
  };
  const page = getPage(params);
  const today = zonedToday(business.timezone, requestTime());

  const { items, total, pageSize } = await listStays({
    businessId: business.id,
    today,
    search: values.q,
    propertyId: values.propriedade,
    status: values.estado ?? "ativas",
    page,
  });
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadias"
        description="Inquilinos e hóspedes por propriedade. Cada estadia tem um link de acesso ao portal do inquilino."
        actions={
          <Button asChild>
            <Link href="/estadias/nova">
              <Plus aria-hidden />
              Nova estadia
            </Link>
          </Button>
        }
      />

      <FilterBar
        values={values}
        fields={[
          { type: "search", name: "q", label: "Pesquisar", placeholder: "Nome ou email" },
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
            allLabel: STAY_FILTER_LABELS.ativas,
            options: STAY_FILTERS.filter((f) => f !== "ativas").map((f) => ({
              value: f,
              label: STAY_FILTER_LABELS[f],
            })),
          },
        ]}
      />

      <StayList
        stays={items}
        today={today}
        empty={
          hasFilters
            ? { title: "Nenhuma estadia encontrada", description: "Experimente alterar ou limpar os filtros." }
            : {
                title: "Ainda não há estadias",
                description: "Registe a estadia de um inquilino para lhe dar acesso ao portal: pagamentos e problemas.",
                action: (
                  <Button asChild>
                    <Link href="/estadias/nova">Registar estadia</Link>
                  </Button>
                ),
              }
        }
      />
      <Pagination pathname="/estadias" params={values} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}

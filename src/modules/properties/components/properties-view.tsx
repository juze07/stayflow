import { Plus } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getEnumParam, getPage, getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listProperties, listPropertyCities } from "../queries";
import { PROPERTY_STATUSES } from "../schemas";
import { PropertyList } from "./property-list";

export async function PropertiesView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  const canManage = canManageOperations(role);

  const values = {
    q: getParam(params, "q"),
    localidade: getParam(params, "localidade"),
    estado: getEnumParam(params, "estado", PROPERTY_STATUSES),
  };
  const page = getPage(params);

  const [{ items, total, pageSize }, cities] = await Promise.all([
    listProperties({
      businessId: business.id,
      search: values.q,
      city: values.localidade,
      status: values.estado ?? "ativas",
      page,
    }),
    listPropertyCities(business.id),
  ]);

  const hasFilters = Boolean(values.q || values.localidade || values.estado);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propriedades"
        description="As casas e apartamentos geridos pela empresa."
        actions={
          canManage && (
            <Button asChild>
              <Link href="/propriedades/nova">
                <Plus aria-hidden />
                Nova propriedade
              </Link>
            </Button>
          )
        }
      />

      <FilterBar
        values={values}
        fields={[
          { type: "search", name: "q", label: "Pesquisar", placeholder: "Nome, morada ou localidade" },
          {
            type: "select",
            name: "localidade",
            label: "Localidade",
            allLabel: "Todas",
            options: cities.map((city) => ({ value: city, label: city })),
          },
          {
            type: "select",
            name: "estado",
            label: "Estado",
            allLabel: "Ativas",
            options: [{ value: "arquivadas", label: "Arquivadas" }],
          },
        ]}
      />

      <PropertyList
        properties={items}
        empty={
          hasFilters
            ? { title: "Nenhuma propriedade encontrada", description: "Experimente alterar ou limpar os filtros." }
            : {
                title: "Ainda não há propriedades",
                description: canManage
                  ? "Registe a primeira propriedade para começar a agendar limpezas e outras tarefas."
                  : "Quando a gestão registar propriedades, aparecem aqui.",
                action: canManage ? (
                  <Button asChild>
                    <Link href="/propriedades/nova">Registar propriedade</Link>
                  </Button>
                ) : undefined,
              }
        }
      />
      <Pagination pathname="/propriedades" params={values} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}

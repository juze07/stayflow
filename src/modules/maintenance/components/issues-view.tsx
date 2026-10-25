import { Plus } from "@/components/ui/icons";
import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getEnumParam, getPage, getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { listPropertyOptions } from "@/modules/properties/queries";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/modules/tasks/constants";
import { listAssigneeOptions } from "@/modules/tasks/queries";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_FILTERS,
  ISSUE_STATUS_FILTER_LABELS,
} from "../constants";
import { listIssues } from "../queries";
import { IssueList } from "./issue-list";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function IssuesView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, user }, params] = await Promise.all([requireBusiness(), searchParams]);

  const propertyParam = getParam(params, "propriedade");
  const assigneeParam = getParam(params, "responsavel");
  const values = {
    q: getParam(params, "q"),
    propriedade: propertyParam && UUID_PATTERN.test(propertyParam) ? propertyParam : undefined,
    responsavel:
      assigneeParam === "eu" || (assigneeParam && UUID_PATTERN.test(assigneeParam)) ? assigneeParam : undefined,
    estado: getEnumParam(params, "estado", ISSUE_STATUS_FILTERS),
    categoria: getEnumParam(params, "categoria", ISSUE_CATEGORIES),
    prioridade: getEnumParam(params, "prioridade", TASK_PRIORITIES),
  };
  const page = getPage(params);

  const [{ items, total, pageSize }, properties, assignees] = await Promise.all([
    listIssues({
      businessId: business.id,
      search: values.q,
      propertyId: values.propriedade,
      assigneeId: values.responsavel === "eu" ? user.id : values.responsavel,
      status: values.estado,
      category: values.categoria,
      priority: values.prioridade,
      page,
    }),
    listPropertyOptions(business.id, { includeArchived: true }),
    listAssigneeOptions(business.id),
  ]);
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manutenção"
        description="Problemas reportados nas propriedades, do registo à resolução."
        actions={
          <Button asChild>
            <Link href="/manutencao/novo">
              <Plus aria-hidden />
              Reportar problema
            </Link>
          </Button>
        }
      />

      <FilterBar
        values={values}
        fields={[
          { type: "search", name: "q", label: "Pesquisar", placeholder: "Descrição do problema" },
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
            allLabel: ISSUE_STATUS_FILTER_LABELS.abertos,
            options: ISSUE_STATUS_FILTERS.filter((s) => s !== "abertos").map((s) => ({
              value: s,
              label: ISSUE_STATUS_FILTER_LABELS[s],
            })),
          },
          {
            type: "select",
            name: "categoria",
            label: "Categoria",
            allLabel: "Todas",
            options: ISSUE_CATEGORIES.map((c) => ({ value: c, label: ISSUE_CATEGORY_LABELS[c] })),
          },
          {
            type: "select",
            name: "prioridade",
            label: "Prioridade",
            allLabel: "Todas",
            options: TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] })),
          },
          {
            type: "select",
            name: "responsavel",
            label: "Responsável",
            options: [
              { value: "eu", label: "Atribuídos a mim" },
              ...assignees.filter((m) => m.id !== user.id).map((m) => ({ value: m.id, label: m.name })),
            ],
          },
        ]}
      />

      <IssueList
        issues={items}
        timeZone={business.timezone}
        empty={
          hasFilters
            ? { title: "Nenhum problema encontrado", description: "Experimente alterar ou limpar os filtros." }
            : {
                title: "Sem problemas por resolver",
                description: "Quando alguém da equipa reportar um problema numa propriedade, aparece aqui.",
              }
        }
      />
      <Pagination pathname="/manutencao" params={values} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}

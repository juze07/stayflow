import { Building2, CalendarCheck, Wrench } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { canManageBusiness, canManageOperations } from "@/modules/business/roles";
import { requireBusiness } from "@/modules/business/queries";
import { getDashboardOverview } from "../queries";
import { GettingStarted, type GettingStartedStep } from "./getting-started";
import { StatCard, StatCardSkeleton } from "./stat-card";

export async function DashboardOverview() {
  const { business, role } = await requireBusiness();
  const overview = await getDashboardOverview(business.id, business.timezone);

  const steps: GettingStartedStep[] = [
    { title: "Criar a empresa", description: `${business.name} está pronta a usar.`, done: true },
    {
      title: "Completar os dados da empresa",
      description: "Morada, contactos e fuso horário.",
      done: overview.hasBusinessDetails,
      href: canManageBusiness(role) ? "/definicoes/empresa" : undefined,
    },
    {
      title: "Convidar a equipa",
      description: "Gestores e colaboradores de limpeza, inspeção e manutenção.",
      done: overview.teamSize > 1 || overview.pendingInvitations > 0,
      href: canManageOperations(role) ? "/definicoes/equipa" : undefined,
    },
    {
      title: "Registar as propriedades",
      description: "O ponto de partida para tarefas, limpezas e despesas.",
      done: overview.activeProperties > 0,
      upcoming: "Fase 3",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Propriedades ativas" value={overview.activeProperties} icon={Building2} />
        <StatCard label="Tarefas para hoje" value={overview.tasksToday} icon={CalendarCheck} />
        <StatCard label="Problemas em aberto" value={overview.openIssues} icon={Wrench} />
      </div>

      <GettingStarted steps={steps} />

      <Alert tone="info">
        O dashboard completo, com gráficos, tarefas urgentes e atividade recente, chega na Fase 3, junto com as
        propriedades e as tarefas.
      </Alert>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="A carregar indicadores">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}

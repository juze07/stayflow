import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { firstName, formatLongDate } from "@/lib/format";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";

export async function Greeting() {
  const { profile, user, business, role } = await requireBusiness();
  const name = firstName(profile.fullName, user.email);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-muted-foreground first-letter:uppercase">
          {formatLongDate(new Date(), business.timezone)}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Olá, {name}</h1>
      </div>
      {canManageOperations(role) && (
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/tarefas?vista=calendario">Calendário</Link>
          </Button>
          <Button asChild>
            <Link href="/tarefas/nova">
              <Plus aria-hidden />
              Nova tarefa
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

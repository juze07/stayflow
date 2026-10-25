import { Plus } from "@/components/ui/icons";
import Link from "next/link";
import { AzulejoPattern } from "@/components/layout/azulejo-pattern";
import { Button } from "@/components/ui/button";
import { firstName, formatLongDate } from "@/lib/format";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";

export async function Greeting() {
  const { profile, user, business, role } = await requireBusiness();
  const name = firstName(profile.fullName, user.email);

  return (
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <AzulejoPattern
        columns={9}
        rows={2}
        className="absolute -top-10 right-0 hidden h-28 w-[26rem] text-primary opacity-[0.09] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)] lg:block"
      />
      <div className="relative space-y-1">
        <p className="text-[13px] font-medium text-muted-foreground first-letter:uppercase">
          {formatLongDate(new Date(), business.timezone)}
        </p>
        <h1 className="font-display text-[32px] leading-tight text-foreground sm:text-4xl">
          Olá, <em>{name}</em>
        </h1>
      </div>
      {canManageOperations(role) && (
        <div className="relative flex gap-2">
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

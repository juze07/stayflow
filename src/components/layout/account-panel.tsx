import { Skeleton } from "@/components/ui/skeleton";
import { requireBusiness } from "@/modules/business/queries";
import { UserMenu } from "./user-menu";

/** Lê a sessão no servidor e mostra o menu do utilizador. */
export async function AccountPanel() {
  const context = await requireBusiness();

  return (
    <UserMenu
      fullName={context.profile.fullName}
      email={context.user.email}
      role={context.role}
      activeBusinessId={context.business.id}
      activeBusinessName={context.business.name}
      businesses={context.memberships.map(({ business }) => ({ id: business.id, name: business.name }))}
    />
  );
}

export function AccountPanelSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2" role="status" aria-label="A carregar">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

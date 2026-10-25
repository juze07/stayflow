"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_GROUPS, SETTINGS_ITEM, type NavItem } from "./nav-items";

type NavProps = { onNavigate?: () => void };

/**
 * Em páginas com endereço dinâmico (ex.: /tarefas/[id]) o caminho só é
 * conhecido no pedido; até lá a navegação aparece sem item ativo.
 */
export function SidebarNav(props: NavProps) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <CurrentNav {...props} />
    </Suspense>
  );
}

function CurrentNav(props: NavProps) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

function NavList({ onNavigate, pathname }: NavProps & { pathname: string | null }) {
  const link = (item: NavItem) => (
    <NavLink
      key={item.href}
      item={item}
      active={pathname !== null && isActivePath(pathname, item.href)}
      onNavigate={onNavigate}
    />
  );

  return (
    <nav aria-label="Navegação principal" className="flex min-h-full flex-col gap-5">
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label ?? index} className="space-y-0.5">
          {group.label && (
            <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
              {group.label}
            </p>
          )}
          {group.items.map(link)}
        </div>
      ))}
      <div className="mt-auto space-y-0.5">{link(SETTINGS_ITEM)}</div>
    </nav>
  );
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors lg:h-8",
        active
          ? "bg-surface text-foreground shadow-raised ring-1 ring-border"
          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
      )}
    >
      <Icon
        weight={active ? "duotone" : "regular"}
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-primary" : "text-subtle-foreground group-hover:text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {!item.available && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
          Em breve
        </span>
      )}
    </Link>
  );
}

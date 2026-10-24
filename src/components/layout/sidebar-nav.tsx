"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS } from "./nav-items";

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
  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname !== null && isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {!item.available && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                Em breve
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-items";

const TABS = [
  { href: "/definicoes", label: "Perfil" },
  { href: "/definicoes/empresa", label: "Empresa" },
  { href: "/definicoes/equipa", label: "Equipa" },
  { href: "/definicoes/listas", label: "Listas de verificação" },
] as const;

/** Em endereços dinâmicos o caminho só é conhecido no pedido; até lá, sem separador ativo. */
export function SettingsTabs() {
  return (
    <Suspense fallback={<Tabs pathname={null} />}>
      <CurrentTabs />
    </Suspense>
  );
}

function CurrentTabs() {
  return <Tabs pathname={usePathname()} />;
}

function Tabs({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Definições" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const active =
            pathname !== null &&
            (tab.href === "/definicoes" ? pathname === tab.href : isActivePath(pathname, tab.href));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

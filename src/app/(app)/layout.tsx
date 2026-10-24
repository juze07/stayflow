import Link from "next/link";
import { Suspense } from "react";
import { AccountPanel, AccountPanelSkeleton } from "@/components/layout/account-panel";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/**
 * Estrutura da área privada: navegação lateral fixa em ecrãs grandes e
 * gaveta em telemóvel. A estrutura é estática (carrega de imediato); os dados
 * do utilizador chegam a seguir, dentro de <Suspense>.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  const account = (
    <Suspense fallback={<AccountPanelSkeleton />}>
      <AccountPanel />
    </Suspense>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav />
        </div>
        <div className="border-t border-border p-3">{account}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <MobileNav businessSlot={account} />
        <Link href="/dashboard">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

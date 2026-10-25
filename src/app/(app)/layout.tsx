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
 *
 * Em ecrãs grandes o conteúdo fica num painel branco, recortado sobre o fundo
 * da barra lateral.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  const account = (
    <Suspense fallback={<AccountPanelSkeleton />}>
      <AccountPanel />
    </Suspense>
  );

  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col lg:flex">
        <div className="flex h-14 items-center px-5">
          <Link href="/dashboard" className="rounded-md">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav />
        </div>
        <div className="p-3">{account}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <MobileNav businessSlot={account} />
        <Link href="/dashboard" className="rounded-md">
          <Logo />
        </Link>
      </header>

      <div className="lg:py-2 lg:pr-2">
        <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-1rem)] lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:shadow-card">
          <main className="mx-auto w-full max-w-6xl animate-fade-up px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

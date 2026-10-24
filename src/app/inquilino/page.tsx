import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { TenantPortal } from "@/modules/tenant/components/tenant-portal";

export const metadata: Metadata = { title: "A minha estadia" };

async function TenantPortalData({ searchParams }: { searchParams: PageProps<"/inquilino">["searchParams"] }) {
  const { pagamento } = await searchParams;
  return <TenantPortal paymentDone={pagamento === "concluido"} />;
}

/** Portal do inquilino: fora da área da empresa, sem navegação de gestão. */
export default function TenantPage({ searchParams }: PageProps<"/inquilino">) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4">
          <Logo />
          <SignOutButton className="w-auto" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Suspense fallback={<ListSkeleton filters={0} rows={4} />}>
          <TenantPortalData searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

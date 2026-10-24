import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { RevenueView } from "@/modules/payments/components/revenue-view";

export const metadata: Metadata = { title: "Receitas" };

export default function RevenuePage({ searchParams }: PageProps<"/receitas">) {
  return (
    <Suspense fallback={<ListSkeleton filters={3} />}>
      <RevenueView searchParams={searchParams} />
    </Suspense>
  );
}

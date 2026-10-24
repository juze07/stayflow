import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PaymentsView } from "@/modules/payments/components/payments-view";

export const metadata: Metadata = { title: "Pagamentos" };

export default function PaymentsPage({ searchParams }: PageProps<"/receitas/pagamentos">) {
  return (
    <Suspense fallback={<ListSkeleton filters={3} />}>
      <PaymentsView searchParams={searchParams} />
    </Suspense>
  );
}

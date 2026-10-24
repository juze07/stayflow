import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { ExpensesView } from "@/modules/expenses/components/expenses-view";

export const metadata: Metadata = { title: "Despesas" };

export default function ExpensesPage({ searchParams }: PageProps<"/despesas">) {
  return (
    <Suspense fallback={<ListSkeleton filters={4} />}>
      <ExpensesView searchParams={searchParams} />
    </Suspense>
  );
}

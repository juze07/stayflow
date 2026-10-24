import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { ExpenseReportView } from "@/modules/expenses/components/expense-report-view";

export const metadata: Metadata = { title: "Relatório de despesas" };

export default function ExpenseReportPage({ searchParams }: PageProps<"/despesas/relatorio">) {
  return (
    <Suspense fallback={<ListSkeleton filters={3} />}>
      <ExpenseReportView searchParams={searchParams} />
    </Suspense>
  );
}

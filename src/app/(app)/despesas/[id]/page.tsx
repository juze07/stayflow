import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { ExpenseDetailView } from "@/modules/expenses/components/expense-detail";

export const metadata: Metadata = { title: "Despesa" };

export default function ExpensePage({ params }: PageProps<"/despesas/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <ExpenseDetailView params={params} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewExpenseForm } from "@/modules/expenses/components/expense-form-page";

export const metadata: Metadata = { title: "Nova despesa" };

export default function NewExpensePage({ searchParams }: PageProps<"/despesas/nova">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Nova despesa" description="Depois de guardar, pode anexar a fatura ou o recibo." />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <NewExpenseForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

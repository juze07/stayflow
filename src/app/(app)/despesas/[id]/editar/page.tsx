import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EditExpenseForm } from "@/modules/expenses/components/expense-form-page";

export const metadata: Metadata = { title: "Editar despesa" };

export default function EditExpensePage({ params }: PageProps<"/despesas/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar despesa" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <EditExpenseForm params={params} />
      </Suspense>
    </div>
  );
}

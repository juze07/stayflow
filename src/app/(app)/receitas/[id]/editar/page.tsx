import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EditPaymentForm } from "@/modules/payments/components/payment-form-page";

export const metadata: Metadata = { title: "Editar pagamento" };

export default function EditPaymentPage({ params }: PageProps<"/receitas/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar pagamento" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <EditPaymentForm params={params} />
      </Suspense>
    </div>
  );
}

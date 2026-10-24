import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewPaymentForm } from "@/modules/payments/components/payment-form-page";

export const metadata: Metadata = { title: "Novo pagamento" };

export default function NewPaymentPage({ searchParams }: PageProps<"/receitas/novo">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Novo pagamento"
        description="Registo manual de um valor a receber ou já recebido. Não processa pagamentos."
      />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <NewPaymentForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { StripeSettings } from "@/modules/stripe/components/stripe-settings";

export const metadata: Metadata = { title: "Pagamentos online" };

async function Settings({ searchParams }: { searchParams: PageProps<"/definicoes/pagamentos">["searchParams"] }) {
  const { stripe } = await searchParams;
  return <StripeSettings returned={stripe === "retorno"} />;
}

export default function OnlinePaymentsSettingsPage({ searchParams }: PageProps<"/definicoes/pagamentos">) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent>
            <FormSkeleton fields={3} />
          </CardContent>
        </Card>
      }
    >
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { PropertyForm } from "@/modules/properties/components/property-form";

export const metadata: Metadata = { title: "Nova propriedade" };

async function NewProperty() {
  const { role } = await requireBusiness();
  if (!canManageOperations(role)) redirect("/propriedades");
  return <PropertyForm cancelHref="/propriedades" />;
}

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Nova propriedade" description="Os dados que a equipa precisa para chegar e trabalhar." />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <NewProperty />
      </Suspense>
    </div>
  );
}

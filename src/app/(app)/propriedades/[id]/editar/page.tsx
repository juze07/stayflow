import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { PropertyForm } from "@/modules/properties/components/property-form";
import { getProperty } from "@/modules/properties/queries";

export const metadata: Metadata = { title: "Editar propriedade" };

async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) redirect(`/propriedades/${id}`);
  const property = await getProperty(business.id, id);

  return (
    <PropertyForm
      propertyId={property.id}
      cancelHref={`/propriedades/${property.id}`}
      defaultValues={{
        name: property.name,
        addressLine: property.addressLine,
        postalCode: property.postalCode,
        city: property.city,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        maxGuests: property.maxGuests,
        accessInstructions: property.accessInstructions ?? "",
        internalNotes: property.internalNotes ?? "",
      }}
    />
  );
}

export default function EditPropertyPage({ params }: PageProps<"/propriedades/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar propriedade" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <EditProperty params={params} />
      </Suspense>
    </div>
  );
}

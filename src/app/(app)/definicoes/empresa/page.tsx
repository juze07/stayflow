import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessSettingsForm } from "@/modules/business/components/business-settings-form";
import { requireBusiness } from "@/modules/business/queries";
import { canManageBusiness } from "@/modules/business/roles";
import { getBusinessSettings } from "@/modules/business/team-queries";

export const metadata: Metadata = { title: "Empresa" };

async function BusinessSettings() {
  const { business, role } = await requireBusiness();
  const settings = await getBusinessSettings(business.id);

  return (
    <BusinessSettingsForm
      readOnly={!canManageBusiness(role)}
      defaultValues={{
        name: settings.name,
        taxId: settings.tax_id ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        addressLine: settings.address_line ?? "",
        postalCode: settings.postal_code ?? "",
        city: settings.city ?? "",
        timezone: settings.timezone,
      }}
    />
  );
}

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <BusinessSettings />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        O logótipo e as preferências de apresentação ainda não estão disponíveis.
      </p>
    </div>
  );
}

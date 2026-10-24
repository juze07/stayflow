import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EditStayForm } from "@/modules/stays/components/stay-form-page";

export const metadata: Metadata = { title: "Editar estadia" };

export default function EditStayPage({ params }: PageProps<"/estadias/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar estadia" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <EditStayForm params={params} />
      </Suspense>
    </div>
  );
}

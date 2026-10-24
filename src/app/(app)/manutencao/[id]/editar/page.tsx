import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EditIssueForm } from "@/modules/maintenance/components/issue-form-page";

export const metadata: Metadata = { title: "Editar problema" };

export default function EditIssuePage({ params }: PageProps<"/manutencao/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar problema" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={5} />
            </CardContent>
          </Card>
        }
      >
        <EditIssueForm params={params} />
      </Suspense>
    </div>
  );
}

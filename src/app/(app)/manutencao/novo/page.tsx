import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewIssueForm } from "@/modules/maintenance/components/issue-form-page";

export const metadata: Metadata = { title: "Reportar problema" };

export default function NewIssuePage({ searchParams }: PageProps<"/manutencao/novo">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Reportar problema" description="Algo avariado, partido ou em falta numa propriedade." />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={5} />
            </CardContent>
          </Card>
        }
      >
        <NewIssueForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

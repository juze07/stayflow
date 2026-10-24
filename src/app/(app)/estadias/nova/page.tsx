import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewStayForm } from "@/modules/stays/components/stay-form-page";

export const metadata: Metadata = { title: "Nova estadia" };

export default function NewStayPage({ searchParams }: PageProps<"/estadias/nova">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nova estadia"
        description="Depois de guardar, copie o link de acesso para enviar ao inquilino."
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
        <NewStayForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { IssueDetailView } from "@/modules/maintenance/components/issue-detail";

export const metadata: Metadata = { title: "Problema de manutenção" };

export default function IssuePage({ params }: PageProps<"/manutencao/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <IssueDetailView params={params} />
    </Suspense>
  );
}

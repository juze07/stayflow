import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { TemplatesList } from "@/modules/checklists/components/templates-list";

export const metadata: Metadata = { title: "Listas de verificação" };

export default function ChecklistTemplatesPage() {
  return (
    <Suspense fallback={<ListSkeleton filters={0} rows={4} />}>
      <TemplatesList />
    </Suspense>
  );
}

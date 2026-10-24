import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { IssuesView } from "@/modules/maintenance/components/issues-view";

export const metadata: Metadata = { title: "Manutenção" };

export default function MaintenancePage({ searchParams }: PageProps<"/manutencao">) {
  return (
    <Suspense fallback={<ListSkeleton filters={4} />}>
      <IssuesView searchParams={searchParams} />
    </Suspense>
  );
}

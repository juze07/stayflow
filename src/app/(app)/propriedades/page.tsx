import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PropertiesView } from "@/modules/properties/components/properties-view";

export const metadata: Metadata = { title: "Propriedades" };

export default function PropertiesPage({ searchParams }: PageProps<"/propriedades">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <PropertiesView searchParams={searchParams} />
    </Suspense>
  );
}

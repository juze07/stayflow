import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PropertyDetailView } from "@/modules/properties/components/property-detail";

export const metadata: Metadata = { title: "Propriedade" };

export default function PropertyPage({ params }: PageProps<"/propriedades/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton filters={0} />}>
      <PropertyDetailView params={params} />
    </Suspense>
  );
}

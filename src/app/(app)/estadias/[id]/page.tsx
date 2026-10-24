import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { StayDetailView } from "@/modules/stays/components/stay-detail";

export const metadata: Metadata = { title: "Estadia" };

export default function StayPage({ params }: PageProps<"/estadias/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <StayDetailView params={params} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { StaysView } from "@/modules/stays/components/stays-view";

export const metadata: Metadata = { title: "Estadias" };

export default function StaysPage({ searchParams }: PageProps<"/estadias">) {
  return (
    <Suspense fallback={<ListSkeleton filters={3} />}>
      <StaysView searchParams={searchParams} />
    </Suspense>
  );
}

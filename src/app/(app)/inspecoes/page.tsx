import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { TasksView } from "@/modules/tasks/components/tasks-view";

export const metadata: Metadata = { title: "Inspeções" };

export default function Page({ searchParams }: PageProps<"/inspecoes">) {
  return (
    <Suspense fallback={<ListSkeleton filters={4} />}>
      <TasksView searchParams={searchParams} fixedType="inspection" />
    </Suspense>
  );
}

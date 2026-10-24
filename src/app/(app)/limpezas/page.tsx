import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { TasksView } from "@/modules/tasks/components/tasks-view";

export const metadata: Metadata = { title: "Limpezas" };

export default function Page({ searchParams }: PageProps<"/limpezas">) {
  return (
    <Suspense fallback={<ListSkeleton filters={4} />}>
      <TasksView searchParams={searchParams} fixedType="cleaning" />
    </Suspense>
  );
}

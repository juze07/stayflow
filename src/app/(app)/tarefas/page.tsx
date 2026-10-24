import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { TasksView } from "@/modules/tasks/components/tasks-view";

export const metadata: Metadata = { title: "Tarefas" };

export default function TasksPage({ searchParams }: PageProps<"/tarefas">) {
  return (
    <Suspense fallback={<ListSkeleton filters={4} />}>
      <TasksView searchParams={searchParams} />
    </Suspense>
  );
}

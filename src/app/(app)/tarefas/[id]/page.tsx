import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { TaskDetailView } from "@/modules/tasks/components/task-detail";

export const metadata: Metadata = { title: "Tarefa" };

export default function TaskPage({ params }: PageProps<"/tarefas/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <TaskDetailView params={params} />
    </Suspense>
  );
}

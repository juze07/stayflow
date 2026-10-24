import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EditTaskForm } from "@/modules/tasks/components/task-form-page";

export const metadata: Metadata = { title: "Editar tarefa" };

export default function EditTaskPage({ params }: PageProps<"/tarefas/[id]/editar">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Editar tarefa" />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <EditTaskForm params={params} />
      </Suspense>
    </div>
  );
}

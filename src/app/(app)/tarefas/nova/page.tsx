import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewTaskForm } from "@/modules/tasks/components/task-form-page";

export const metadata: Metadata = { title: "Nova tarefa" };

export default function NewTaskPage({ searchParams }: PageProps<"/tarefas/nova">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Nova tarefa" description="Agende uma tarefa e atribua-a a alguém da equipa." />
      <Suspense
        fallback={
          <Card>
            <CardContent>
              <FormSkeleton fields={6} />
            </CardContent>
          </Card>
        }
      >
        <NewTaskForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

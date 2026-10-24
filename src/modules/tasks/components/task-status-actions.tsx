"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setTaskStatusAction } from "../actions";
import { STATUS_ACTION_LABELS, nextStatuses, type TaskStatus } from "../constants";

type TaskStatusActionsProps = { taskId: string; status: TaskStatus };

/** Botões para avançar o estado da tarefa. Cancelar pede confirmação. */
export function TaskStatusActions({ taskId, status }: TaskStatusActionsProps) {
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<TaskStatus | null>(null);

  async function change(next: TaskStatus) {
    setFeedback(null);
    setTarget(next);
    const result = await setTaskStatusAction({ taskId, status: next });
    setFeedback(
      result.ok
        ? { tone: "success", message: result.message ?? "Estado alterado." }
        : { tone: "danger", message: result.error },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {nextStatuses(status).map((next, index) =>
          next === "cancelled" ? (
            <ConfirmDialog
              key={next}
              trigger={
                <Button variant="ghost" disabled={isPending}>
                  {STATUS_ACTION_LABELS[next]}
                </Button>
              }
              title="Cancelar tarefa?"
              description="A tarefa fica registada como cancelada. Pode repô-la mais tarde."
              confirmLabel="Cancelar tarefa"
              cancelLabel="Voltar"
              onConfirm={() => change(next)}
            />
          ) : (
            <Button
              key={next}
              variant={index === 0 ? "primary" : "secondary"}
              loading={isPending && target === next}
              disabled={isPending}
              onClick={() => startTransition(() => change(next))}
            >
              {STATUS_ACTION_LABELS[next]}
            </Button>
          ),
        )}
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </div>
  );
}

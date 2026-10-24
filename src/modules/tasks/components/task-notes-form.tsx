"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskNotesAction } from "../actions";

type TaskNotesFormProps = { taskId: string; notes: string | null };

export function TaskNotesForm({ taskId, notes }: TaskNotesFormProps) {
  const [value, setValue] = useState(notes ?? "");
  const [saved, setSaved] = useState(notes ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setFeedback(null);
        startTransition(async () => {
          const result = await updateTaskNotesAction({ taskId, notes: value });
          if (result.ok) {
            setSaved(value);
            setFeedback({ tone: "success", message: result.message ?? "Guardado." });
          } else {
            setFeedback({ tone: "danger", message: result.fieldErrors?.notes?.[0] ?? result.error });
          }
        });
      }}
    >
      <label htmlFor="task-notes" className="sr-only">
        Notas
      </label>
      <Textarea
        id="task-notes"
        rows={3}
        maxLength={4000}
        placeholder="Ex.: faltavam toalhas, chave deixada na caixa."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" loading={isPending} disabled={value === saved}>
          Guardar notas
        </Button>
        {feedback && (
          <Alert tone={feedback.tone} className="flex-1 py-2">
            {feedback.message}
          </Alert>
        )}
      </div>
    </form>
  );
}

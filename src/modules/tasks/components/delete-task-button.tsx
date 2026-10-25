"use client";

import { Trash2 } from "@/components/ui/icons";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTaskAction } from "../actions";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <ConfirmDialog
        trigger={
          <Button variant="ghost">
            <Trash2 className="text-destructive" aria-hidden />
            Apagar
          </Button>
        }
        title="Apagar tarefa?"
        description={`"${title}" é apagada definitivamente. Se só não vai ser feita, prefira cancelá-la para manter o histórico.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          setError(null);
          // Em caso de sucesso, a ação redireciona para a lista.
          const result = await deleteTaskAction(taskId);
          if (!result.ok) setError(result.error);
        }}
      />
      {error && <Alert tone="danger">{error}</Alert>}
    </>
  );
}

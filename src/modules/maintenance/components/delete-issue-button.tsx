"use client";

import { Trash2 } from "@/components/ui/icons";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteIssueAction } from "../actions";

export function DeleteIssueButton({ issueId, title }: { issueId: string; title: string }) {
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
        title="Apagar problema?"
        description={`"${title}" é apagado definitivamente. As tarefas ligadas mantêm-se, mas deixam de apontar para ele. Se foi resolvido ou não se aplica, prefira mudar o estado.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          setError(null);
          // Em caso de sucesso, a ação redireciona para a lista.
          const result = await deleteIssueAction(issueId);
          if (!result.ok) setError(result.error);
        }}
      />
      {error && <Alert tone="danger">{error}</Alert>}
    </>
  );
}

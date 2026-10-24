"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteExpenseAction } from "../actions";

export function DeleteExpenseButton({ expenseId, description }: { expenseId: string; description: string }) {
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
        title="Apagar despesa?"
        description={`"${description}" e os comprovativos anexados são apagados definitivamente.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          setError(null);
          // Em caso de sucesso, a ação redireciona para a lista.
          const result = await deleteExpenseAction(expenseId);
          if (!result.ok) setError(result.error);
        }}
      />
      {error && <Alert tone="danger">{error}</Alert>}
    </>
  );
}

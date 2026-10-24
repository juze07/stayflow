"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setPropertyArchivedAction } from "../actions";

type ArchivePropertyButtonProps = { propertyId: string; propertyName: string; archived: boolean };

export function ArchivePropertyButton({ propertyId, propertyName, archived }: ArchivePropertyButtonProps) {
  const [error, setError] = useState<string | null>(null);

  if (archived) {
    return (
      <div className="space-y-2">
        <ConfirmDialog
          trigger={
            <Button variant="secondary">
              <ArchiveRestore aria-hidden />
              Reativar
            </Button>
          }
          title="Reativar propriedade?"
          description={`${propertyName} volta a aparecer nas listas e pode voltar a receber tarefas.`}
          confirmLabel="Reativar"
          destructive={false}
          onConfirm={async () => {
            setError(null);
            const result = await setPropertyArchivedAction(propertyId, false);
            if (!result.ok) setError(result.error);
          }}
        />
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ConfirmDialog
        trigger={
          <Button variant="secondary">
            <Archive aria-hidden />
            Arquivar
          </Button>
        }
        title="Arquivar propriedade?"
        description={`${propertyName} deixa de aparecer nas listas e não recebe tarefas novas. O histórico de tarefas e despesas mantém-se e pode reativá-la a qualquer momento.`}
        confirmLabel="Arquivar"
        destructive
        onConfirm={async () => {
          setError(null);
          const result = await setPropertyArchivedAction(propertyId, true);
          if (!result.ok) setError(result.error);
        }}
      />
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

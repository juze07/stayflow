"use client";

import { RotateCcw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { deleteStayAction, resetStayAccessAction, setStayCancelledAction } from "../actions";

type Feedback = { tone: "success" | "danger"; message: string } | null;

function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const run = async (action: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setFeedback(null);
    const result = await action();
    setFeedback(
      result.ok
        ? { tone: "success", message: result.message ?? "Alteração guardada." }
        : { tone: "danger", message: result.error ?? "Erro." },
    );
  };
  return { feedback, run };
}

/** Link de acesso ao portal: copiar para enviar ao inquilino, ou retirar o acesso. */
export function StayAccessActions({ stayId, link, linked }: { stayId: string; link: string; linked: boolean }) {
  const { feedback, run } = useFeedback();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!linked && <CopyButton value={link} label="Copiar link de acesso" />}
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <RotateCcw aria-hidden />
              {linked ? "Retirar acesso" : "Gerar novo link"}
            </Button>
          }
          title={linked ? "Retirar o acesso do inquilino?" : "Gerar um novo link?"}
          description="O link atual deixa de funcionar e a conta ligada deixa de ver esta estadia. Pode enviar o novo link a seguir."
          confirmLabel={linked ? "Retirar acesso" : "Gerar novo link"}
          onConfirm={() => run(() => resetStayAccessAction(stayId))}
        />
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </div>
  );
}

export function StayLifecycleActions({ stayId, cancelled }: { stayId: string; cancelled: boolean }) {
  const { feedback, run } = useFeedback();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {cancelled ? (
          <Button variant="secondary" onClick={() => run(() => setStayCancelledAction(stayId, false))}>
            Reativar estadia
          </Button>
        ) : (
          <ConfirmDialog
            trigger={
              <Button variant="ghost">
                <XCircle aria-hidden />
                Cancelar estadia
              </Button>
            }
            title="Cancelar estadia?"
            description="O inquilino deixa de ver a estadia no portal. Os pagamentos e problemas registados mantêm-se."
            confirmLabel="Cancelar estadia"
            cancelLabel="Voltar"
            onConfirm={() => run(() => setStayCancelledAction(stayId, true))}
          />
        )}
        <ConfirmDialog
          trigger={
            <Button variant="ghost">
              <Trash2 className="text-destructive" aria-hidden />
              Apagar
            </Button>
          }
          title="Apagar estadia?"
          description="A estadia é apagada definitivamente. Os pagamentos ficam como receitas sem estadia."
          confirmLabel="Apagar"
          onConfirm={() => run(() => deleteStayAction(stayId))}
        />
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </div>
  );
}

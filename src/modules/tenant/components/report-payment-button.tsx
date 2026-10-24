"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportPaymentAction } from "../actions";
import { reportPaymentSchema } from "../schemas";

/** "Já paguei": o inquilino indica a referência e a empresa confirma o recebimento. */
export function ReportPaymentButton({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Já paguei
      </Button>
    );
  }

  return (
    <form
      className="w-full space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = reportPaymentSchema.safeParse({ reference });
        if (!parsed.success) {
          setFeedback({ tone: "danger", message: parsed.error.issues[0]?.message ?? "Referência inválida." });
          return;
        }
        startTransition(async () => {
          setFeedback(null);
          const result = await reportPaymentAction(paymentId, { reference });
          setFeedback(
            result.ok
              ? { tone: "success", message: result.message ?? "Enviado." }
              : { tone: "danger", message: result.error },
          );
        });
      }}
    >
      <label className="block space-y-1 text-xs text-muted-foreground">
        Referência do pagamento (opcional)
        <Input
          value={reference}
          maxLength={200}
          placeholder="Ex.: transferência de 01/11, MB WAY"
          onChange={(event) => setReference(event.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          Voltar
        </Button>
        <Button type="submit" size="sm" loading={isPending}>
          Avisar a empresa
        </Button>
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </form>
  );
}

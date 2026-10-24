"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setIssueFinalCostAction } from "../actions";

/** O custo final é registado por quem resolveu (responsável) ou pela gestão. */
export function FinalCostForm({ issueId, initialValue }: { issueId: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setFeedback(null);
        startTransition(async () => {
          const result = await setIssueFinalCostAction({ issueId, finalCost: value });
          if (result.ok) {
            setSaved(value);
            setFeedback({ tone: "success", message: result.message ?? "Guardado." });
          } else {
            setFeedback({ tone: "danger", message: result.fieldErrors?.finalCost?.[0] ?? result.error });
          }
        });
      }}
    >
      <label htmlFor="final-cost" className="text-xs text-muted-foreground">
        Custo final (€)
      </label>
      <div className="flex gap-2">
        <Input
          id="final-cost"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" variant="secondary" loading={isPending} disabled={value === saved}>
          Guardar
        </Button>
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </form>
  );
}

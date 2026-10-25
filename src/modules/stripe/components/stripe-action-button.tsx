"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { connectStripeAccountAction, payByCardAction, refreshStripeAccountAction, showMyIbanAction } from "../actions";

const ACTIONS = {
  connect: () => connectStripeAccountAction(),
  refresh: () => refreshStripeAccountAction(),
  iban: (id: string) => showMyIbanAction(id),
  card: (id: string) => payByCardAction(id),
} satisfies Record<string, (id: string) => Promise<ActionResult>>;

type StripeActionButtonProps = {
  action: keyof typeof ACTIONS;
  id?: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
};

/** Botão que chama uma ação da Stripe; as que abrem a Stripe redirecionam. */
export function StripeActionButton({ action, id = "", variant = "primary", children }: StripeActionButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant={variant}
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await ACTIONS[action](id);
            if (!result.ok) setError(result.error);
          })
        }
      >
        {children}
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

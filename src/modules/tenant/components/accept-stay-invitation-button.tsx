"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { acceptStayInvitationAction } from "../actions";

export function AcceptStayInvitationButton({
  token,
  label = "Abrir a minha estadia",
}: {
  token: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button
        className="w-full"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptStayInvitationAction(token);
            if (!result.ok) setError(result.error);
          })
        }
      >
        {label}
      </Button>
    </div>
  );
}

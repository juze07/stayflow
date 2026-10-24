"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setChecklistTemplateActiveAction } from "../actions";

export function TemplateActiveToggle({ templateId, isActive }: { templateId: string; isActive: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await setChecklistTemplateActiveAction(templateId, !isActive);
            if (!result.ok) setError(result.error);
          })
        }
      >
        {isActive ? "Desativar" : "Reativar"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

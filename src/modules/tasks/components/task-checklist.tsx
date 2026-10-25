"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setChecklistItemAction } from "../actions";
import type { ChecklistItem } from "../queries";

type TaskChecklistProps = {
  items: ChecklistItem[];
  /** Responsável ou gestor, com a tarefa ainda aberta. */
  editable: boolean;
  timeZone: string;
};

/** Lista de verificação da tarefa: cada item é marcado na hora e regista quem o marcou. */
export function TaskChecklist({ items, editable, timeZone }: TaskChecklistProps) {
  const [optimistic, setOptimistic] = useOptimistic(items, (current, change: { id: string; checked: boolean }) =>
    current.map((item) => (item.id === change.id ? { ...item, isChecked: change.checked } : item)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const done = optimistic.filter((item) => item.isChecked).length;

  function toggle(item: ChecklistItem) {
    setError(null);
    startTransition(async () => {
      setOptimistic({ id: item.id, checked: !item.isChecked });
      const result = await setChecklistItemAction({ itemId: item.id, checked: !item.isChecked });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">
          {done} de {optimistic.length} itens feitos
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Progresso da lista"
          aria-valuemin={0}
          aria-valuemax={optimistic.length}
          aria-valuenow={done}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(done / optimistic.length) * 100}%` }} />
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <ul className="divide-y divide-border rounded-md border border-border">
        {optimistic.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                "flex items-start gap-3 px-3 py-3",
                editable ? "cursor-pointer transition-colors hover:bg-muted/50" : "cursor-default",
              )}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={item.isChecked}
                disabled={!editable}
                onChange={() => toggle(item)}
              />
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  item.isChecked && "border-primary bg-primary text-primary-foreground",
                )}
                aria-hidden
              >
                {item.isChecked && <Check className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm text-foreground",
                    item.isChecked && "text-muted-foreground line-through",
                  )}
                >
                  {item.label}
                  {!item.isRequired && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
                </span>
                {item.isChecked && item.checkedBy && item.checkedAt && (
                  <span className="block text-xs text-muted-foreground">
                    {item.checkedBy}, {formatDateTime(item.checkedAt, timeZone)}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { AlertDialog } from "radix-ui";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  /** O elemento que abre o diálogo (normalmente um botão). */
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Ação a executar. O diálogo fica aberto, com indicador, até terminar. */
  onConfirm: () => Promise<void> | void;
};

/** Confirmação obrigatória antes de ações destrutivas ou difíceis de desfazer. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-foreground/30 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 animate-scale-in rounded-xl border border-border bg-surface p-6 shadow-overlay">
          <AlertDialog.Title className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={isPending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={destructive ? "destructive" : "primary"}
              loading={isPending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  setOpen(false);
                })
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

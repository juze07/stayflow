"use client";

import { Dialog } from "radix-ui";
import { X } from "@/components/ui/icons";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

type SheetContentProps = ComponentProps<typeof Dialog.Content> & {
  title: string;
  children: ReactNode;
};

/** Painel lateral (gaveta), usado na navegação em telemóvel. */
export function SheetContent({ title, className, children, ...props }: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-foreground/30 backdrop-blur-[2px]" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] animate-slide-in-left flex-col border-r border-border bg-background shadow-overlay focus:outline-none",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        <Dialog.Description className="sr-only">{title}</Dialog.Description>
        {children}
        <Dialog.Close
          className="absolute top-3 right-3 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-5" aria-hidden />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

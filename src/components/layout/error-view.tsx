"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export type ErrorViewProps = { error: unknown; retry: () => void };

/** Ecrã de erro com opção de tentar novamente. Não mostra detalhes técnicos. */
export function ErrorView({ error, retry }: ErrorViewProps) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-destructive-soft text-destructive ring-1 ring-destructive/15">
        <TriangleAlert className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold tracking-tight">Não foi possível carregar esta página</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente; se o problema continuar, contacte o suporte
          {digest ? ` (referência ${digest})` : ""}.
        </p>
      </div>
      <Button onClick={retry}>Tentar novamente</Button>
    </div>
  );
}

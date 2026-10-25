import { ArrowRight, Check } from "@/components/ui/icons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type GettingStartedStep = {
  title: string;
  description: string;
  done: boolean;
  href?: string;
  /** Passo que depende de uma funcionalidade ainda por implementar. */
  upcoming?: string;
};

export function GettingStarted({ steps }: { steps: GettingStartedStep[] }) {
  const completed = steps.filter((step) => step.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Primeiros passos</h2>
          <p className="text-[13px] text-muted-foreground">
            {completed} de {steps.length} concluídos
          </p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:w-48"
          role="progressbar"
          aria-label="Progresso dos primeiros passos"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const actionable = step.href && !step.done && !step.upcoming;
          const content = (
            <div className="flex h-full items-start gap-3 p-4">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-strong bg-surface text-muted-foreground",
                )}
                aria-hidden
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-muted-foreground line-through decoration-border-strong" : "text-foreground",
                  )}
                >
                  {step.title}
                  <span className="sr-only">{step.done ? " (concluído)" : " (por fazer)"}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{step.description}</p>
                {actionable && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                    Começar
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                )}
              </div>
              {step.upcoming && <Badge>{step.upcoming}</Badge>}
            </div>
          );

          return (
            <li key={step.title} className="bg-surface">
              {actionable ? (
                <Link href={step.href!} className="group block h-full transition-colors hover:bg-surface-raised">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

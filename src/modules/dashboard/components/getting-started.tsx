import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primeiros passos</CardTitle>
        <CardDescription>
          {completed} de {steps.length} concluídos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="divide-y divide-border">
          {steps.map((step) => {
            const Icon = step.done ? CheckCircle2 : Circle;
            const content = (
              <div className="flex items-start gap-3 py-3">
                <Icon className={cn("mt-0.5 size-5 shrink-0", step.done ? "text-success" : "text-input")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", step.done ? "text-muted-foreground" : "text-foreground")}>
                    {step.title}
                    <span className="sr-only">{step.done ? " (concluído)" : " (por fazer)"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {step.upcoming && <Badge>{step.upcoming}</Badge>}
              </div>
            );

            return (
              <li key={step.title}>
                {step.href && !step.done && !step.upcoming ? (
                  <Link href={step.href} className="-mx-2 block rounded-md px-2 hover:bg-muted">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

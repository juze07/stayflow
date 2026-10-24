import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  /** "danger" destaca o valor quando pede atenção (ex.: tarefas atrasadas). */
  tone?: "danger";
  href?: string;
};

export function StatCard({ label, value, icon: Icon, hint, tone, href }: StatCardProps) {
  const content = (
    <Card className={cn("h-full p-5", href && "transition-colors hover:border-input")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon
          className={cn("size-4 shrink-0", tone === "danger" ? "text-destructive" : "text-muted-foreground")}
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
          tone === "danger" ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );

  return href ? (
    <Link href={href} className="block rounded-lg">
      {content}
    </Link>
  ) : (
    content
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-12" />
    </Card>
  );
}

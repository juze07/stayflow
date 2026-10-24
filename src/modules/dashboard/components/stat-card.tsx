import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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

/**
 * Grupo de indicadores: uma só moldura dividida em células, como nos painéis
 * financeiros. Em telemóvel fica em duas colunas.
 */
export function StatGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone, href }: StatCardProps) {
  const danger = tone === "danger";
  const content = (
    <>
      <div className="flex items-start gap-2">
        <Icon
          className={cn("mt-px size-4 shrink-0", danger ? "text-destructive" : "text-subtle-foreground")}
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-[13px] leading-snug font-medium text-muted-foreground">{label}</p>
        {href && (
          <ArrowUpRight
            className="size-4 shrink-0 text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          />
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px] sm:leading-9",
          danger ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const cell = "group block h-full bg-surface p-4 sm:p-5";
  return href ? (
    <Link href={href} className={cn(cell, "transition-colors hover:bg-surface-raised focus-visible:-outline-offset-2")}>
      {content}
    </Link>
  ) : (
    <div className={cell}>{content}</div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface p-4 sm:p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-8 w-14" />
    </div>
  );
}

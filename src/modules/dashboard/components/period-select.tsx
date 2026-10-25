"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { PERIOD_LABELS, PERIODS, type Period } from "../period";

const SHORT_LABELS: Record<Period, string> = { "7d": "7 dias", "30d": "30 dias", mes: "Este mês" };

/** Controlo segmentado para escolher o período dos indicadores. */
export function PeriodSelect({ value }: { value: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(value);

  return (
    <div
      role="radiogroup"
      aria-label="Período"
      aria-busy={isPending}
      className="inline-flex rounded-lg border border-border bg-muted p-0.5"
    >
      {PERIODS.map((period) => {
        const selected = period === current;
        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={selected}
            title={PERIOD_LABELS[period]}
            onClick={() =>
              startTransition(() => {
                setCurrent(period);
                router.replace(period === "7d" ? pathname : `${pathname}?periodo=${period}`, { scroll: false });
              })
            }
            className={cn(
              "h-7 cursor-pointer rounded-md px-3 text-[13px] font-medium transition-all",
              selected
                ? "bg-surface text-foreground shadow-raised ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {SHORT_LABELS[period]}
          </button>
        );
      })}
    </div>
  );
}

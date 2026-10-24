"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { PERIOD_LABELS, PERIODS, type Period } from "../period";

export function PeriodSelect({ value }: { value: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-44" aria-busy={isPending}>
      <label htmlFor="periodo" className="sr-only">
        Período
      </label>
      <Select
        id="periodo"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() =>
            router.replace(next === "7d" ? pathname : `${pathname}?periodo=${next}`, { scroll: false }),
          );
        }}
      >
        {PERIODS.map((period) => (
          <option key={period} value={period}>
            {PERIOD_LABELS[period]}
          </option>
        ))}
      </Select>
    </div>
  );
}

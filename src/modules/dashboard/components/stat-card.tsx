import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardProps = { label: string; value: number; icon: LucideIcon; hint?: string };

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
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

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Estado de carregamento para listas e tabelas. */
export function ListSkeleton({ rows = 5, filters = 3 }: { rows?: number; filters?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="A carregar">
      <div className="flex flex-col gap-3 sm:flex-row">
        {Array.from({ length: filters }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full sm:w-44" />
        ))}
      </div>
      <Card className="divide-y divide-border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </Card>
    </div>
  );
}

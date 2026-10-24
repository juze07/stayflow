import { Skeleton } from "@/components/ui/skeleton";

/** Estado de carregamento genérico para formulários. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="A carregar">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

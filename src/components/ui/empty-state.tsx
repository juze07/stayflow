import type { IconComponent } from "@/components/ui/icons";
import type { ReactNode } from "react";
import { AzulejoPattern } from "@/components/layout/azulejo-pattern";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative flex size-24 items-center justify-center">
        <AzulejoPattern
          columns={3}
          rows={3}
          className="absolute inset-0 text-primary opacity-[0.16] [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
        />
        <div className="relative flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-primary shadow-raised">
          <Icon className="size-5" weight="duotone" aria-hidden />
        </div>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

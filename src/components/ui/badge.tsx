import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground ring-border",
        primary: "bg-primary-soft text-primary ring-primary/15",
        success: "bg-success-soft text-success ring-success/15",
        warning: "bg-warning-soft text-warning ring-warning/20",
        danger: "bg-destructive-soft text-destructive ring-destructive/15",
        info: "bg-info-soft text-info ring-info/15",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

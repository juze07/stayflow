import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex gap-2.5 rounded-lg border p-3 text-sm leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-info/15 bg-info-soft text-info",
        success: "border-success/20 bg-success-soft text-success",
        warning: "border-warning/20 bg-warning-soft text-warning",
        danger: "border-destructive/20 bg-destructive-soft text-destructive",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: AlertCircle };

export function Alert({
  className,
  tone = "info",
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const Icon = icons[tone ?? "info"];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn(alertVariants({ tone }), className)} {...props}>
      <Icon aria-hidden />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

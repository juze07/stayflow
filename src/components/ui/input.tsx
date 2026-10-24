import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldBaseClass =
  "w-full rounded-md border border-input bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 sm:text-sm";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(fieldBaseClass, "h-10", className)} {...props} />;
}

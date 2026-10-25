import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldBaseClass =
  "w-full rounded-md border border-input bg-surface px-3 text-base text-foreground shadow-xs placeholder:text-subtle-foreground transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/15 sm:text-sm";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(fieldBaseClass, "h-10 sm:h-9", className)} {...props} />;
}

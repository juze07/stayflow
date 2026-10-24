import { House } from "lucide-react";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-foreground", className)}>
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <House className="size-4" aria-hidden />
      </span>
      <span className="text-base tracking-tight">{appConfig.name}</span>
    </span>
  );
}

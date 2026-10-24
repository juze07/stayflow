import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

/** Símbolo da marca: um telhado e uma porta, em traço simples. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink text-ink-foreground shadow-button",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" className="size-[18px]" aria-hidden>
        <path
          d="M3.5 9.25 10 4l6.5 5.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5.75 8v7.25h8.5V8" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" opacity=".55" />
        <rect x="8.5" y="11" width="3" height="4.25" rx="0.75" fill="#3ccf9e" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold text-foreground", className)}>
      <LogoMark />
      <span className="text-[15px] tracking-tight">{appConfig.name}</span>
    </span>
  );
}

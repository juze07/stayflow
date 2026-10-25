import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

/**
 * Símbolo da marca: um azulejo. Flor de quatro pétalas sobre azul cobalto,
 * com o centro em ocre.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7 shrink-0 drop-shadow-[0_1px_1px_rgb(16_26_44/0.18)]", className)}
      aria-hidden
    >
      <rect width="28" height="28" rx="7.5" fill="var(--color-primary)" />
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill="none" stroke="#fff" strokeOpacity=".14" />
      <g fill="#f6f4ef">
        <circle cx="14" cy="9.2" r="4.4" />
        <circle cx="18.8" cy="14" r="4.4" />
        <circle cx="14" cy="18.8" r="4.4" />
        <circle cx="9.2" cy="14" r="4.4" />
      </g>
      <circle cx="14" cy="14" r="2.5" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-foreground", className)}>
      <LogoMark />
      <span className="font-display text-[22px] leading-none tracking-tight">{appConfig.name}</span>
    </span>
  );
}

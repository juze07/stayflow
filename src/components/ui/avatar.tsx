import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type AvatarProps = { name?: string | null; email?: string; className?: string };

export function Avatar({ name, email, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary ring-1 ring-primary/10",
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}

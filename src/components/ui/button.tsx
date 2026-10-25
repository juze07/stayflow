import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover",
        secondary:
          "border border-border-strong bg-surface text-foreground shadow-xs hover:border-input hover:bg-muted/60 [&_svg]:text-muted-foreground",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-white shadow-button hover:bg-destructive-hover",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 sm:h-9 sm:px-3.5",
        lg: "h-11 px-5 text-[15px]",
        icon: "size-10 sm:size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Renderiza o filho (ex.: <Link>) com o estilo de botão. */
    asChild?: boolean;
    /** Mostra um indicador de carregamento e desativa o botão. */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export { buttonVariants };

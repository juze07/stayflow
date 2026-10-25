import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Título, formulário e rodapé dos ecrãs de autenticação, com entrada escalonada. */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="space-y-7">
      <div className="animate-rise space-y-2" style={{ animationDelay: "60ms" }}>
        <h1 className="font-display text-4xl leading-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="animate-rise" style={{ animationDelay: "160ms" }}>
        {children}
      </div>
      {footer && (
        <p
          className="animate-rise border-t border-border pt-5 text-sm text-muted-foreground"
          style={{ animationDelay: "260ms" }}
        >
          {footer}
        </p>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Título, formulário e rodapé dos ecrãs de autenticação (sem moldura, ao estilo das apps de produtividade). */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
      {footer && <p className="border-t border-border pt-5 text-sm text-muted-foreground">{footer}</p>}
    </div>
  );
}

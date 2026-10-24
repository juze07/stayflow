import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type FormFieldProps = {
  label: string;
  /** Mensagem de erro de validação, mostrada por baixo do campo. */
  error?: string;
  /** Texto de ajuda, mostrado quando não há erro. */
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

/** Etiqueta + campo + mensagem de erro, com ligações de acessibilidade. */
export function FormField({ label, error, hint, optional, className, children }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = (isValidElement(children) && children.props.id) || generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {cloneElement(children, {
        id: fieldId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hasMessage ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

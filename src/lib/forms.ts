import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "./action-result";

/**
 * Mostra no formulário os erros devolvidos por uma Server Action.
 * Devolve a mensagem geral, para apresentar no topo do formulário.
 */
export function applyServerErrors<T extends FieldValues>(
  result: ActionResult<unknown> | undefined,
  setError: UseFormSetError<T>,
): string | null {
  if (!result || result.ok) return null;

  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (messages?.[0]) setError(field as Path<T>, { type: "server", message: messages[0] });
  }

  return result.error;
}

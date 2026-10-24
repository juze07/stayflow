import type { ZodType } from "zod";
import { z } from "@/lib/zod";

/**
 * Formato único de resposta das Server Actions. A interface mostra `error`
 * no topo do formulário e `fieldErrors` junto de cada campo.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function success<T = undefined>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data: data as T, message };
}

export function failure(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> } {
  return { ok: false, error, fieldErrors };
}

/**
 * Valida no servidor os dados recebidos do browser, com o mesmo schema Zod do
 * formulário. Nunca confiamos na validação feita no cliente.
 */
export function parseInput<S extends ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.output<S> } | ReturnType<typeof failure> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const { fieldErrors } = z.flattenError(parsed.error);
  return failure("Verifique os campos assinalados.", fieldErrors as Record<string, string[] | undefined>);
}

export const GENERIC_ERROR = "Ocorreu um erro inesperado. Tente novamente dentro de momentos.";

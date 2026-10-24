/**
 * Valida o parâmetro `next` usado depois do login. Só aceita caminhos internos,
 * para impedir redirecionamentos para sites externos (open redirect).
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}

/**
 * Leitura segura dos parâmetros do endereço (?q=...&pagina=2). Os filtros das
 * listas vivem no URL, para que possam ser partilhados e sobrevivam a um refresh.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 20;

/** Primeiro valor de um parâmetro, sem espaços nas pontas; "" passa a undefined. */
export function getParam(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

/** Valor de um parâmetro apenas se pertencer à lista permitida. */
export function getEnumParam<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = getParam(params, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Número de página (1 por defeito, nunca abaixo de 1). */
export function getPage(params: SearchParams): number {
  const page = Number(getParam(params, "pagina"));
  return Number.isInteger(page) && page > 1 ? Math.min(page, 10_000) : 1;
}

/** Intervalo de linhas para `.range(from, to)` do Supabase (ambos inclusivos). */
export function pageRange(page: number, pageSize = PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/**
 * Texto de pesquisa para filtros `ilike`/`or` do PostgREST. Remove os
 * caracteres com significado especial (vírgulas, parênteses, curingas e
 * barras), para que a pesquisa nunca altere a estrutura do filtro.
 */
export function toIlikePattern(search: string | undefined): string | null {
  const cleaned = (search ?? "")
    .replace(/[,()%*_\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned ? `%${cleaned}%` : null;
}

/** Monta um endereço com parâmetros, omitindo os vazios. */
export function buildHref(pathname: string, params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

import { appConfig } from "@/config/app";

/**
 * Formatação para Portugal: euros, datas dd/mm/aaaa e horas de 24h.
 * Os valores monetários são guardados em cêntimos (inteiros) na base de dados.
 */

export function formatCurrency(cents: number, currency: string = appConfig.currency): string {
  return new Intl.NumberFormat(appConfig.locale, { style: "currency", currency }).format(cents / 100);
}

/** Converte texto escrito pelo utilizador ("12,50" ou "1 234,5") em cêntimos. */
export function parseCurrencyToCents(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/[€\s]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Cêntimos no formato de um campo de valor ("45,90"); null fica vazio. */
export function formatCentsInput(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: DateInput, timeZone: string = appConfig.defaultTimezone): string {
  return new Intl.DateTimeFormat(appConfig.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(toDate(value));
}

export function formatTime(value: DateInput, timeZone: string = appConfig.defaultTimezone): string {
  return new Intl.DateTimeFormat(appConfig.locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(toDate(value));
}

export function formatDateTime(value: DateInput, timeZone: string = appConfig.defaultTimezone): string {
  return `${formatDate(value, timeZone)} ${formatTime(value, timeZone)}`;
}

/** Data longa para cabeçalhos, ex.: "sábado, 24 de outubro". */
export function formatLongDate(value: DateInput, timeZone: string = appConfig.defaultTimezone): string {
  return new Intl.DateTimeFormat(appConfig.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(toDate(value));
}

/** Primeiro nome, ou o início do email quando não há nome. */
export function firstName(fullName: string | null | undefined, email?: string): string {
  const name = fullName?.trim();
  if (name) return name.split(/\s+/)[0];
  return email?.split("@")[0] ?? "";
}

/** Iniciais para avatares, ex.: "Ana Sousa" -> "AS". */
export function initials(fullName: string | null | undefined, email?: string): string {
  const source = fullName?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

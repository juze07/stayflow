/**
 * Datas no fuso horário da empresa. A base de dados guarda instantes em UTC;
 * "hoje" depende do fuso (e das mudanças de hora), por isso é calculado aqui.
 */

function timeZoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));

  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Instante UTC correspondente à meia-noite de um dia civil num fuso. */
export function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const firstPass = guess - timeZoneOffsetMs(guess, timeZone);
  return new Date(guess - timeZoneOffsetMs(firstPass, timeZone));
}

/** Ano, mês e dia civis de um instante, num fuso. */
export function zonedCalendarDate(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Início (inclusivo) e fim (exclusivo) do dia de `instant` no fuso indicado. */
export function dayRange(instant: Date, timeZone: string): { start: Date; end: Date } {
  const { year, month, day } = zonedCalendarDate(instant, timeZone);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    start: zonedMidnight(year, month, day, timeZone),
    end: zonedMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone),
  };
}

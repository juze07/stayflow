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

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Valida uma data civil no formato AAAA-MM-DD (o valor de <input type="date">). */
export function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Valida uma hora no formato HH:MM (o valor de <input type="time">). */
export function isClockTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/**
 * Converte data e hora escritas no fuso da empresa num instante UTC.
 * Ex.: "2026-07-15" + "10:00" em Lisboa -> 2026-07-15T09:00:00Z.
 */
export function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hours, minutes);
  const firstPass = guess - timeZoneOffsetMs(guess, timeZone);
  return new Date(guess - timeZoneOffsetMs(firstPass, timeZone));
}

/** Data (AAAA-MM-DD) e hora (HH:MM) de um instante no fuso da empresa, para preencher formulários. */
export function splitZonedDateTime(instant: Date | string, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Data civil de hoje (AAAA-MM-DD) no fuso indicado. */
export function zonedToday(timeZone: string, now: Date = new Date()): string {
  return splitZonedDateTime(now, timeZone).date;
}

/** Soma dias a uma data civil (AAAA-MM-DD), sem depender do fuso. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Início do primeiro dia e fim (exclusivo) do último dia de um intervalo de datas civis, em UTC. */
export function zonedDateRange(from: string, to: string, timeZone: string): { start: Date; end: Date } {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = addDays(to, 1).split("-").map(Number);
  return { start: zonedMidnight(fy, fm, fd, timeZone), end: zonedMidnight(ty, tm, td, timeZone) };
}

/** Mês no formato AAAA-MM; devolve null se inválido. */
export function parseMonth(value: string | undefined): { year: number; month: number } | null {
  const match = value ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value) : null;
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 2000 || year > 2100) return null;
  return { year, month: Number(match[2]) };
}

/** Formata ano e mês como AAAA-MM, avançando ou recuando `offset` meses. */
export function formatMonth(year: number, month: number, offset = 0): string {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

/**
 * Dias da grelha de um mês num calendário que começa à segunda-feira,
 * incluindo os dias do mês anterior e seguinte que completam as semanas.
 */
export function monthGrid(year: number, month: number): { date: string; inMonth: boolean }[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const leading = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;
  const start = addDays(first.toISOString().slice(0, 10), -leading);

  return Array.from({ length: total }, (_, index) => {
    const date = addDays(start, index);
    return { date, inMonth: Number(date.slice(5, 7)) === month };
  });
}

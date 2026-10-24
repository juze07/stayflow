import { addDays, zonedToday } from "@/lib/dates";

export const PERIODS = ["7d", "30d", "mes"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  mes: "Este mês",
};

/** Datas civis (inclusivas) de um período, terminando hoje no fuso da empresa. */
export function periodRange(period: Period, timeZone: string, now: Date): { from: string; to: string } {
  const today = zonedToday(timeZone, now);
  switch (period) {
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "mes":
      return { from: `${today.slice(0, 7)}-01`, to: today };
  }
}

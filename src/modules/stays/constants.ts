/** Estados das estadias (calculados a partir das datas e do cancelamento). */

export const STAY_STATUSES = ["upcoming", "current", "finished", "cancelled"] as const;
export type StayStatus = (typeof STAY_STATUSES)[number];

export const STAY_STATUS_LABELS: Record<StayStatus, string> = {
  upcoming: "Próxima",
  current: "A decorrer",
  finished: "Terminada",
  cancelled: "Cancelada",
};

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const STAY_STATUS_TONES: Record<StayStatus, Tone> = {
  upcoming: "info",
  current: "success",
  finished: "neutral",
  cancelled: "danger",
};

/** Filtro de estado da lista (no URL: `estado`). */
export const STAY_FILTERS = ["ativas", "terminadas", "canceladas", "todas"] as const;
export type StayFilter = (typeof STAY_FILTERS)[number];

export const STAY_FILTER_LABELS: Record<StayFilter, string> = {
  ativas: "Próximas e a decorrer",
  terminadas: "Terminadas",
  canceladas: "Canceladas",
  todas: "Todas",
};

/** Estado de uma estadia num dado dia (datas civis AAAA-MM-DD, saída inclusiva). */
export function stayStatus(
  stay: { startsOn: string; endsOn: string | null; cancelledAt: string | null },
  today: string,
): StayStatus {
  if (stay.cancelledAt) return "cancelled";
  if (stay.startsOn > today) return "upcoming";
  if (stay.endsOn !== null && stay.endsOn < today) return "finished";
  return "current";
}

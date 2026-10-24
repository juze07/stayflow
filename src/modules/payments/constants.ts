/** Estados e métodos dos pagamentos (iguais aos CHECK da base de dados). */

export const PAYMENT_STATUSES = ["pending", "paid", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Por receber",
  paid: "Recebido",
  cancelled: "Cancelado",
};

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  cancelled: "neutral",
};

export const PAYMENT_METHODS = ["transfer", "mbway", "cash", "card", "platform", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Transferência",
  mbway: "MB WAY",
  cash: "Numerário",
  card: "Cartão",
  platform: "Plataforma (Airbnb, Booking...)",
  other: "Outro",
};

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Filtro de estado da lista (no URL: `estado`); "em-atraso" são os por receber já vencidos. */
export const PAYMENT_FILTERS = ["por-receber", "em-atraso", "recebidos", "cancelados", "todos"] as const;
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

export const PAYMENT_FILTER_LABELS: Record<PaymentFilter, string> = {
  "por-receber": "Por receber",
  "em-atraso": "Em atraso",
  recebidos: "Recebidos",
  cancelados: "Cancelados",
  todos: "Todos",
};

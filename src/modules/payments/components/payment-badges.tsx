import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES, type PaymentStatus } from "../constants";

export function PaymentStatusBadge({ status, overdue }: { status: PaymentStatus; overdue?: boolean }) {
  if (status === "pending" && overdue) return <Badge tone="danger">Em atraso</Badge>;
  return <Badge tone={PAYMENT_STATUS_TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

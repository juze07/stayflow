import { Badge } from "@/components/ui/badge";
import { STAY_STATUS_LABELS, STAY_STATUS_TONES, type StayStatus } from "../constants";

export function StayStatusBadge({ status }: { status: StayStatus }) {
  return <Badge tone={STAY_STATUS_TONES[status]}>{STAY_STATUS_LABELS[status]}</Badge>;
}

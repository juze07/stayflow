import { Badge } from "@/components/ui/badge";
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_TONES, type IssueStatus } from "../constants";

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge tone={ISSUE_STATUS_TONES[status]}>{ISSUE_STATUS_LABELS[status]}</Badge>;
}

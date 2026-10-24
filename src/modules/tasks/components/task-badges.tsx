import { AlertTriangle, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  INSPECTION_RESULT_LABELS,
  INSPECTION_RESULT_TONES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
  type InspectionResult,
  type TaskPriority,
  type TaskStatus,
} from "../constants";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_STATUS_TONES[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

/** Só mostra prioridades que merecem atenção (alta e urgente). */
export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority !== "high" && priority !== "urgent") return null;
  return (
    <Badge tone={TASK_PRIORITY_TONES[priority]}>
      {priority === "urgent" && <Flame className="size-3" aria-hidden />}
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function OverdueBadge() {
  return (
    <Badge tone="danger">
      <AlertTriangle className="size-3" aria-hidden />
      Atrasada
    </Badge>
  );
}

export function InspectionResultBadge({ result }: { result: InspectionResult }) {
  return <Badge tone={INSPECTION_RESULT_TONES[result]}>{INSPECTION_RESULT_LABELS[result]}</Badge>;
}

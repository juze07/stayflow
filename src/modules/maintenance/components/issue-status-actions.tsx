"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { setIssueStatusAction } from "../actions";
import { ISSUE_STATUS_ACTION_LABELS, nextIssueStatuses, type IssueStatus } from "../constants";

export function IssueStatusActions({ issueId, status }: { issueId: string; status: IssueStatus }) {
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [target, setTarget] = useState<IssueStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {nextIssueStatuses(status).map((next) => (
          <Button
            key={next}
            variant={next === "resolved" || next === "open" ? "primary" : next === "cancelled" ? "ghost" : "secondary"}
            loading={isPending && target === next}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setTarget(next);
                const result = await setIssueStatusAction({ issueId, status: next });
                setFeedback(
                  result.ok
                    ? { tone: "success", message: result.message ?? "Estado alterado." }
                    : { tone: "danger", message: result.error },
                );
              })
            }
          >
            {ISSUE_STATUS_ACTION_LABELS[next]}
          </Button>
        ))}
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
    </div>
  );
}

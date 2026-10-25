import { Wrench } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskPriorityBadge } from "@/modules/tasks/components/task-badges";
import { ISSUE_CATEGORY_LABELS } from "../constants";
import type { IssueListItem } from "../queries";
import { IssueStatusBadge } from "./issue-badges";

type IssueListProps = {
  issues: IssueListItem[];
  timeZone: string;
  hideProperty?: boolean;
  empty: { title: string; description?: ReactNode; action?: ReactNode };
};

export function IssueList({ issues, timeZone, hideProperty, empty }: IssueListProps) {
  if (issues.length === 0) {
    return <EmptyState icon={Wrench} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Link
              href={`/manutencao/${issue.id}`}
              className={cn(
                "flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4",
                issue.priority === "urgent" &&
                  issue.status !== "resolved" &&
                  issue.status !== "cancelled" &&
                  "bg-destructive-soft/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ISSUE_CATEGORY_LABELS[issue.category]}
                  {!hideProperty && issue.property && ` · ${issue.property.name}`}
                  {` · ${issue.assignee?.name ?? "Sem responsável"}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {issue.fromTenant && <Badge tone="primary">Inquilino</Badge>}
                <IssueStatusBadge status={issue.status} />
                <TaskPriorityBadge priority={issue.priority} />
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                  {formatDate(issue.reportedAt, timeZone)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

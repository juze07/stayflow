import { CalendarDays, Link2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { stayStatus } from "../constants";
import type { StayListItem } from "../queries";
import { StayStatusBadge } from "./stay-badges";

type StayListProps = {
  stays: StayListItem[];
  today: string;
  empty: { title: string; description?: ReactNode; action?: ReactNode };
};

export function stayPeriod(startsOn: string, endsOn: string | null) {
  // Datas civis: formatadas em UTC para não mudarem de dia.
  return endsOn
    ? `${formatDate(startsOn, "UTC")} a ${formatDate(endsOn, "UTC")}`
    : `Desde ${formatDate(startsOn, "UTC")}`;
}

export function StayList({ stays, today, empty }: StayListProps) {
  if (stays.length === 0) {
    return <EmptyState icon={CalendarDays} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {stays.map((stay) => (
          <li key={stay.id}>
            <Link
              href={`/estadias/${stay.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{stay.guestName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {stay.property?.name ?? "Propriedade removida"} · {stayPeriod(stay.startsOn, stay.endsOn)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {stay.linked && (
                  <Link2 className="size-4 text-muted-foreground" aria-label="Conta do inquilino ligada" />
                )}
                <StayStatusBadge status={stayStatus(stay, today)} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

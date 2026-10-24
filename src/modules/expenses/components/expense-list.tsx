import { Paperclip, Receipt } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "../constants";
import type { ExpenseListItem } from "../queries";

type ExpenseListProps = {
  expenses: ExpenseListItem[];
  hideProperty?: boolean;
  empty: { title: string; description?: ReactNode; action?: ReactNode };
};

export function ExpenseList({ expenses, hideProperty, empty }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <EmptyState icon={Receipt} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {expenses.map((expense) => (
          <li key={expense.id}>
            <Link
              href={`/despesas/${expense.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{expense.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {/* Datas civis: formatadas em UTC para não mudarem de dia. */}
                  {formatDate(expense.incurredOn, "UTC")} · {EXPENSE_CATEGORY_LABELS[expense.category]}
                  {!hideProperty && ` · ${expense.property?.name ?? "Geral"}`}
                  {expense.supplier && ` · ${expense.supplier}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {expense.receiptCount > 0 && (
                  <Paperclip className="size-4 text-muted-foreground" aria-label="Com comprovativo" />
                )}
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(expense.amountCents)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

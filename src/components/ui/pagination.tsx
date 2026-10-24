import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buildHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

type PaginationProps = {
  pathname: string;
  /** Parâmetros atuais (filtros), mantidos ao mudar de página. */
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
};

const linkClass =
  "inline-flex h-8 items-center gap-1 rounded-md border border-border-strong bg-surface px-2.5 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-muted/60";

export function Pagination({ pathname, params, page, pageSize, total }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const hrefFor = (target: number) => buildHref(pathname, { ...params, pagina: target > 1 ? target : undefined });

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Paginação">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {first}–{last} de {total}
      </p>
      {pageCount > 1 && (
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
              <ChevronLeft className="size-4" aria-hidden />
              Anterior
            </Link>
          ) : (
            <span className={cn(linkClass, "pointer-events-none opacity-50")} aria-disabled>
              <ChevronLeft className="size-4" aria-hidden />
              Anterior
            </span>
          )}
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
              Seguinte
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(linkClass, "pointer-events-none opacity-50")} aria-disabled>
              Seguinte
              <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

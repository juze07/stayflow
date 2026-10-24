"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export type FilterField =
  | { type: "search"; name: string; label: string; placeholder?: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[]; allLabel?: string }
  | { type: "date"; name: string; label: string };

type FilterBarProps = {
  fields: FilterField[];
  /** Valores atuais, lidos do URL no servidor. */
  values: Record<string, string | undefined>;
  /** Parâmetros que se mantêm mas não são filtros (ex.: vista do calendário). */
  preserve?: Record<string, string | undefined>;
  className?: string;
};

/**
 * Filtros de uma lista. Cada alteração atualiza o URL (sem recarregar a
 * página) e o servidor devolve a lista filtrada; a página volta sempre à 1.
 */
export function FilterBar({ fields, values, preserve, className }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Recria os campos de pesquisa ao limpar os filtros, para esvaziar o texto escrito.
  const [resetKey, setResetKey] = useState(0);

  const filterNames = fields.map((field) => field.name);
  const hasActiveFilters = filterNames.some((name) => values[name]);

  function apply(next: Record<string, string | undefined>) {
    const href = buildHref(pathname, { ...preserve, ...values, ...next, pagina: undefined });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function clearAll() {
    setResetKey((key) => key + 1);
    apply(Object.fromEntries(filterNames.map((name) => [name, undefined])));
  }

  return (
    <div
      className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", className)}
      aria-busy={isPending}
      data-pending={isPending || undefined}
    >
      {fields.map((field) => {
        const id = `filtro-${field.name}`;
        return (
          <div key={field.name} className={cn("min-w-0", field.type === "search" ? "sm:w-64" : "sm:w-48")}>
            <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
              {field.label}
            </label>
            {field.type === "search" ? (
              <SearchField
                key={resetKey}
                id={id}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onCommit={(value) => apply({ [field.name]: value || undefined })}
              />
            ) : field.type === "select" ? (
              <Select
                id={id}
                value={values[field.name] ?? ""}
                onChange={(event) => apply({ [field.name]: event.target.value || undefined })}
              >
                <option value="">{field.allLabel ?? "Todos"}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={id}
                type="date"
                value={values[field.name] ?? ""}
                onChange={(event) => apply({ [field.name]: event.target.value || undefined })}
              />
            )}
          </div>
        );
      })}
      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="md" onClick={clearAll}>
          <X aria-hidden />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

type SearchFieldProps = { id: string; value: string; placeholder?: string; onCommit: (value: string) => void };

/** Pesquisa que espera que a pessoa pare de escrever antes de pedir resultados. */
function SearchField({ id, value, placeholder, onCommit }: SearchFieldProps) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        className="pl-9"
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => onCommitRef.current(next.trim()), 350);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            clearTimeout(timer.current);
            onCommitRef.current(text.trim());
          }
        }}
      />
    </div>
  );
}

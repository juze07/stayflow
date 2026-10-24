"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Link entre "Entrar" e "Criar conta" que mantém o destino (`next`). */
export function AuthSwitchLink({ href, children }: { href: "/entrar" | "/registar"; children: string }) {
  const next = useSearchParams().get("next");
  const target = next ? `${href}?next=${encodeURIComponent(next)}` : href;
  return (
    <Link href={target} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}

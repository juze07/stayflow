import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Despesas" };

export default function Page() {
  return <ComingSoon title="Despesas" description="Controlo interno das despesas operacionais." phase="Fase 5" />;
}

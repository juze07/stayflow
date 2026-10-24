import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Propriedades" };

export default function Page() {
  return <ComingSoon title="Propriedades" description="Registe e gira as propriedades da empresa." phase="Fase 3" />;
}

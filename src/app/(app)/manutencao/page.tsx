import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Manutenção" };

export default function Page() {
  return <ComingSoon title="Manutenção" description="Registe e acompanhe problemas nas propriedades." phase="Fase 4" />;
}

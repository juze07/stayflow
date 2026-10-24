import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Tarefas" };

export default function Page() {
  return <ComingSoon title="Tarefas" description="Planeie e acompanhe as tarefas da equipa." phase="Fase 3" />;
}

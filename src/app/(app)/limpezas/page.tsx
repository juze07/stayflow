import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Limpezas" };

export default function Page() {
  return (
    <ComingSoon
      title="Limpezas"
      description="Organize limpezas com listas de verificação e fotografias."
      phase="Fase 4"
    />
  );
}

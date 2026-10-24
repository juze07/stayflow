import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Inspeções" };

export default function Page() {
  return (
    <ComingSoon
      title="Inspeções"
      description="Verifique se as propriedades estão prontas a receber hóspedes."
      phase="Fase 4"
    />
  );
}

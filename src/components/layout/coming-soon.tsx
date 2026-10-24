import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type ComingSoonProps = {
  title: string;
  description: string;
  phase: string;
};

/**
 * Página de uma secção ainda não implementada. Indica-o claramente, em vez de
 * mostrar dados fictícios ou botões sem função.
 */
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Secção em desenvolvimento"
        description={`Esta secção ainda não está disponível. Vai ser implementada na ${phase} do plano.`}
      />
    </div>
  );
}

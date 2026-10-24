import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ManagersOnly() {
  return (
    <EmptyState
      icon={Lock}
      title="Sem acesso às despesas"
      description="As despesas e os relatórios são visíveis apenas para administradores e gestores."
    />
  );
}

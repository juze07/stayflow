import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ManagersOnly({
  title = "Sem acesso às despesas",
  description = "As despesas e os relatórios são visíveis apenas para administradores e gestores.",
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={Lock} title={title} description={description} />;
}

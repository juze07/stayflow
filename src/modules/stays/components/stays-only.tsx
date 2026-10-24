import { ManagersOnly } from "@/modules/expenses/components/managers-only";

export function StaysManagersOnly() {
  return (
    <ManagersOnly
      title="Sem acesso às estadias e receitas"
      description="As estadias, os inquilinos e as receitas são visíveis apenas para administradores e gestores."
    />
  );
}

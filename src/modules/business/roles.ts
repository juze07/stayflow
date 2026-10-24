/**
 * Funções dentro de uma empresa. As mesmas regras estão aplicadas na base de
 * dados (RLS); aqui servem para decidir o que a interface mostra.
 */
export const ROLES = ["admin", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gestor",
  staff: "Colaborador",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acesso total, incluindo definições da empresa e equipa.",
  manager: "Gere propriedades, tarefas e despesas, e convida colaboradores.",
  staff: "Vê as operações e atualiza as tarefas atribuídas a si.",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Pode gerir operações (propriedades, tarefas, despesas). */
export function canManageOperations(role: Role): boolean {
  return role === "admin" || role === "manager";
}

/** Pode alterar as definições da empresa e as funções dos membros. */
export function canManageBusiness(role: Role): boolean {
  return role === "admin";
}

/** Pode convidar pessoas com uma dada função. */
export function canInvite(role: Role, invitedRole: Role): boolean {
  if (role === "admin") return true;
  if (role === "manager") return invitedRole !== "admin";
  return false;
}

/** Funções que um utilizador pode atribuir num convite. */
export function invitableRoles(role: Role): Role[] {
  return ROLES.filter((candidate) => canInvite(role, candidate));
}

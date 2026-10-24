import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  Receipt,
  Settings,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Secções ainda por implementar aparecem marcadas na navegação. */
  available: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, available: true },
  { href: "/propriedades", label: "Propriedades", icon: Building2, available: true },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo, available: true },
  { href: "/limpezas", label: "Limpezas", icon: Sparkles, available: true },
  { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck, available: true },
  { href: "/manutencao", label: "Manutenção", icon: Wrench, available: true },
  { href: "/despesas", label: "Despesas", icon: Receipt, available: false },
  { href: "/definicoes", label: "Definições", icon: Settings, available: true },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

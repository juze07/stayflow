import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  Receipt,
  Settings,
  Sparkles,
  Wallet,
  Wrench,
  type IconComponent,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconComponent;
  /** Secções ainda por implementar aparecem marcadas na navegação. */
  available: boolean;
};

export type NavGroup = {
  /** Título do grupo; o primeiro grupo não tem título. */
  label?: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, available: true }],
  },
  {
    label: "Operações",
    items: [
      { href: "/propriedades", label: "Propriedades", icon: Building2, available: true },
      { href: "/tarefas", label: "Tarefas", icon: ListTodo, available: true },
      { href: "/limpezas", label: "Limpezas", icon: Sparkles, available: true },
      { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck, available: true },
      { href: "/manutencao", label: "Manutenção", icon: Wrench, available: true },
    ],
  },
  {
    label: "Reservas e finanças",
    items: [
      { href: "/estadias", label: "Estadias", icon: CalendarDays, available: true },
      { href: "/receitas", label: "Receitas", icon: Wallet, available: true },
      { href: "/despesas", label: "Despesas", icon: Receipt, available: true },
    ],
  },
];

/** Fora dos grupos, no fundo da barra lateral. */
export const SETTINGS_ITEM: NavItem = { href: "/definicoes", label: "Definições", icon: Settings, available: true };

export const NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((group) => group.items), SETTINGS_ITEM];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

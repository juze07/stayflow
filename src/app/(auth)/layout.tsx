import { CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/layout/logo";
import { appConfig } from "@/config/app";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "Limpezas e inspeções",
    text: "Listas de verificação, fotografias e resultado por propriedade.",
  },
  {
    icon: CalendarCheck,
    title: "Estadias e receitas",
    text: "Reservas, pagamentos e um portal próprio para o inquilino.",
  },
  {
    icon: ShieldCheck,
    title: "Dados privados",
    text: "Cada empresa vê apenas os seus registos, com permissões por função.",
  },
];

/** Ecrãs de autenticação: formulário à esquerda, apresentação do produto à direita em ecrãs grandes. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,34rem)] xl:grid-cols-[1fr_minmax(0,40rem)]">
      <div className="flex flex-col bg-surface px-4 py-8 sm:px-8">
        <Link href="/entrar" className="self-start rounded-md">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 animate-fade-up flex-col justify-center py-12">
          {children}
        </main>
        <p className="text-xs text-subtle-foreground">{appConfig.description}</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <LogoMark className="relative size-9 bg-white/10 ring-1 ring-white/15" />
        <div className="relative space-y-10">
          <div className="space-y-3">
            <h2 className="max-w-md text-3xl font-semibold tracking-tight text-balance">
              A operação do seu Alojamento Local, num só sítio.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-white/60">
              Propriedades, equipa, tarefas, estadias e contas organizadas para quem gere o dia a dia.
            </p>
          </div>
          <ul className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                  <Icon className="size-4 text-[#3ccf9e]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-white/55">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Feito para Alojamento Local em Portugal.</p>
      </aside>
    </div>
  );
}

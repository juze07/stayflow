import Link from "next/link";
import { AzulejoPattern } from "@/components/layout/azulejo-pattern";
import { Logo, LogoMark } from "@/components/layout/logo";
import { CalendarCheck, ShieldCheck, Sparkles } from "@/components/ui/icons";
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

/**
 * Ecrãs de autenticação: formulário à esquerda; à direita, em ecrãs grandes,
 * um painel de azulejos animado com a apresentação do produto.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1fr_minmax(0,36rem)] xl:grid-cols-[1fr_minmax(0,42rem)]">
      <div className="relative flex flex-col overflow-hidden px-4 py-8 sm:px-8">
        <div className="relative -mx-4 -mt-8 h-36 overflow-hidden bg-ink sm:-mx-8 lg:hidden">
          <AzulejoPattern
            animated
            columns={10}
            rows={4}
            className="absolute inset-0 text-[#8fa8ff] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
          />
          <Link href="/entrar" className="absolute top-6 left-4 animate-rise rounded-md sm:left-8">
            <Logo className="text-ink-foreground" />
          </Link>
        </div>
        <Link href="/entrar" className="relative hidden animate-rise self-start rounded-md lg:inline-flex">
          <Logo />
        </Link>
        <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 lg:py-12">
          {children}
        </main>
        <p className="relative text-xs text-subtle-foreground">{appConfig.description}</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <AzulejoPattern
          animated
          columns={9}
          rows={11}
          className="absolute -inset-x-8 -top-8 text-[#8fa8ff] [mask-image:radial-gradient(ellipse_80%_55%_at_80%_10%,black_25%,transparent_80%)]"
        />
        <div className="relative animate-rise">
          <LogoMark className="size-11 animate-float" />
        </div>
        <div className="relative space-y-10">
          <div className="space-y-4">
            <h2
              className="font-display max-w-md animate-rise text-[44px] leading-[1.05] text-balance"
              style={{ animationDelay: "120ms" }}
            >
              A operação do seu Alojamento Local, <em className="text-[#f0c592]">num só sítio.</em>
            </h2>
            <p
              className="max-w-md animate-rise text-[15px] leading-relaxed text-white/60"
              style={{ animationDelay: "220ms" }}
            >
              Propriedades, equipa, tarefas, estadias e contas organizadas para quem gere o dia a dia.
            </p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                className="flex animate-rise gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 backdrop-blur-sm"
                style={{ animationDelay: `${340 + index * 110}ms` }}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#8fa8ff]/10 ring-1 ring-[#8fa8ff]/20">
                  <Icon className="size-[18px] text-[#b9c8ff]" weight="duotone" aria-hidden />
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

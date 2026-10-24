# StayFlow

Plataforma SaaS de gestão operacional para empresas de Alojamento Local: propriedades, tarefas, limpezas,
inspeções, manutenção e despesas, com equipas e dados isolados por empresa.

> O nome é provisório. Para o alterar, defina `NEXT_PUBLIC_APP_NAME` ou edite `src/config/app.ts`.

## Estado

| Fase | Conteúdo                                                               | Estado    |
| ---- | ---------------------------------------------------------------------- | --------- |
| 1    | Análise e arquitetura                                                  | Concluída |
| 2    | Fundação: layout, design, Supabase, autenticação, empresa, equipa, RLS | Concluída |
| 3    | Propriedades, tarefas, dashboard, pesquisa e filtros                   | Concluída |
| 4    | Limpezas, listas de verificação, inspeções, manutenção                 | Concluída |
| 5    | Despesas, relatórios, anexos e fotografias                             | Por fazer |
| 6    | Testes end-to-end, desempenho, preparação para produção                | Por fazer |

As secções ainda não implementadas aparecem na navegação com a etiqueta "Em breve" e uma página que o indica.

## Tecnologias

- **Next.js 16** (App Router, Cache Components) + **TypeScript** estrito
- **Tailwind CSS 4** com tokens de design em `src/app/globals.css`
- **Supabase**: PostgreSQL, autenticação e armazenamento de ficheiros
- **React Hook Form** + **Zod** (o mesmo schema valida no browser e no servidor)
- **Radix UI** (primitivos acessíveis) e **Lucide** (ícones)
- **Vitest** (testes unitários) e **pgTAP** (testes de segurança na base de dados)

## Estrutura

```
src/
├─ app/                  Rotas (páginas finas que juntam módulos)
│  ├─ (auth)/            entrar, registar, recuperar e redefinir palavra-passe
│  ├─ (app)/             área privada com navegação lateral
│  ├─ auth/confirm/      destino dos links enviados por email
│  ├─ convite/[token]/   aceitar convite para uma empresa
│  └─ onboarding/        criar a primeira empresa
├─ modules/              um módulo por domínio: schemas, queries, actions, components
├─ components/ui/        sistema de design (botões, campos, cartões, diálogos…)
├─ components/layout/    navegação, menus e estruturas de página
├─ lib/                  Supabase, formatação pt-PT, datas, validação
└─ proxy.ts              renova a sessão e protege as rotas privadas
supabase/
├─ migrations/           SQL versionado (tabelas, RLS, Storage)
├─ tests/database/       testes pgTAP de isolamento entre empresas
└─ templates/            emails de autenticação em português
```

## Segurança multiempresa

- Todas as tabelas com dados de clientes têm `business_id` e **Row Level Security** ativo.
- As políticas usam funções auxiliares (`private.user_business_ids()`), por isso a regra está escrita uma vez.
- Chaves estrangeiras compostas impedem ligar registos de empresas diferentes.
- Triggers garantem regras de negócio no servidor (ex.: uma limpeza só fica concluída com a lista completa).
- Os ficheiros vivem num bucket privado; o caminho começa pelo `business_id` e o Storage verifica-o.
- O browser só conhece a chave pública. A chave secreta (`service_role`) não é usada pela aplicação.
- `npm run test:db` prova, tabela a tabela, que uma empresa não lê nem altera dados de outra.

## Desenvolvimento local

Requisitos: Node.js 22+, Docker (para o Supabase local).

```bash
npm install
npx supabase start          # arranca Postgres, Auth, Storage e um servidor de email de teste
cp .env.example .env.local  # preencha com os valores mostrados pelo comando anterior
npm run dev                 # http://localhost:3000
```

Valores para `.env.local` em desenvolvimento local (mostrados por `npx supabase status`):

- `NEXT_PUBLIC_SUPABASE_URL` = `API_URL` (normalmente `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `PUBLISHABLE_KEY` (começa por `sb_publishable_`)

Os emails de confirmação e recuperação não são enviados de verdade em local: abra o Mailpit em
http://127.0.0.1:54324 para os ver.

### Comandos

| Comando             | O que faz                                           |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                         |
| `npm run build`     | Build de produção                                   |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | Verificação de tipos TypeScript                     |
| `npm test`          | Testes unitários (Vitest)                           |
| `npm run test:db`   | Testes de RLS e regras de negócio na base de dados  |
| `npm run db:reset`  | Recria a base de dados local a partir das migrações |
| `npm run db:types`  | Regenera `src/lib/supabase/database.types.ts`       |
| `npm run format`    | Formata o código com Prettier                       |

Regra importante: **todas as alterações à base de dados são feitas com uma nova migração** em
`supabase/migrations/` (`npx supabase migration new nome`), nunca à mão no painel do Supabase.

## Configurar o projeto Supabase (produção)

1. Crie um projeto em [supabase.com](https://supabase.com), na região **Central EU (Frankfurt)**. Guarde a
   palavra-passe da base de dados num gestor de palavras-passe.
2. Aplique as migrações. O workflow `.github/workflows/deploy-migrations.yml` fá-lo sozinho a cada merge na `main`
   (ou à mão em Actions → "Migrações (produção)"), com os secrets do repositório `SUPABASE_ACCESS_TOKEN` e
   `SUPABASE_DB_PASSWORD`. O _project ref_ está no próprio workflow.
3. Em **Authentication → URL Configuration**:
   - _Site URL_: o endereço público da aplicação (ex.: `https://app.stayflow.pt`)
   - _Redirect URLs_: `https://app.stayflow.pt/**`
4. Em **Authentication → Providers → Email**: ative _Confirm email_. Em **Authentication → Policies** (ou
   _Password security_), use no mínimo 8 caracteres com letras e números.
5. Em **Authentication → Email Templates**, copie o conteúdo de `supabase/templates/confirmation.html` (Confirm
   signup) e `supabase/templates/recovery.html` (Reset password), com os assuntos definidos em
   `supabase/config.toml`.
6. Em **Authentication → SMTP Settings**, configure um fornecedor de email (ex.: Resend, Postmark). O servidor
   de email incluído no Supabase envia muito poucos emails por hora e não serve para clientes reais.
7. Em **Project Settings → API**, copie o _Project URL_ e a _publishable key_ para as variáveis de ambiente da
   plataforma de alojamento (ex.: Vercel), junto com `NEXT_PUBLIC_SITE_URL`.

Nunca coloque a chave `service_role`/`sb_secret_` nem a palavra-passe da base de dados no código, no chat ou em
variáveis `NEXT_PUBLIC_*`.

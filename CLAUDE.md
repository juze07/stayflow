# StayFlow: guia rápido para agentes

SaaS multiempresa para gestão operacional de Alojamento Local (Portugal). Interface e mensagens em português de
Portugal. Leia também `AGENTS.md` (regras do Next.js 16) e `README.md` (setup e produção).

## Stack

Next.js 16 (App Router, Cache Components, `src/proxy.ts` em vez de middleware) · React 19 · TypeScript estrito ·
Tailwind 4 (tokens em `src/app/globals.css`) · Supabase (Postgres, Auth, Storage) via `@supabase/ssr` · React Hook
Form + Zod 4 · Radix UI (pacote `radix-ui`) · Phosphor (via `components/ui/icons`) · Recharts · Vitest · pgTAP.

## Estrutura

- `src/app/` páginas finas. `(auth)` login/registo; `(app)` área privada; `auth/confirm` links de email.
- `src/modules/<domínio>/` `schemas.ts` (Zod, partilhado cliente/servidor), `queries.ts` (`server-only`),
  `actions.ts` (Server Actions), `components/`, `constants.ts`. Domínios: auth, business, profile, properties, tasks
  (inclui limpezas/inspeções: `TasksView fixedType`, lista e resultado), checklists (modelos, RPC
  `save_checklist_template`), maintenance, expenses (despesas e relatório, RPC `expense_report`), attachments (envio
  direto do browser para o Storage + registo validado por trigger; `files.ts` remove ficheiros ao apagar), dashboard,
  stays (estadias + link de acesso do inquilino), payments (pagamentos e painel de receitas vs despesas, RPC
  `revenue_report`), tenant (portal `/inquilino`: só RPC `my_*`/`report_*`, o inquilino não é membro).
- `src/components/ui/` design system; `src/components/layout/` navegação e esqueletos; `src/components/filters/`.
- `src/lib/` supabase (server/client/proxy, `database.types.ts` gerado), `dates.ts` (fuso da empresa),
  `format.ts` (pt-PT), `search-params.ts` (filtros no URL, paginação, `toIlikePattern`), `action-result.ts`.
- `supabase/migrations/` SQL versionado; `supabase/tests/database/` pgTAP; `supabase/templates/` emails.

## Convenções

- Páginas síncronas; dados num componente async dentro de `<Suspense>` com esqueleto. `params`/`searchParams` são
  Promises passadas ao componente async. Hooks de URL (`usePathname`) só dentro de Suspense.
- Contexto: `requireBusiness()` → `{ user, business, role }`. Permissões na UI: `canManageOperations(role)`
  (admin/gestor) e `canManageBusiness(role)` (admin). A regra real está no RLS.
- Server Actions: `parseInput(schema, input)` → `ActionResult` (`success`/`failure`); erros de campo com
  `applyServerErrors` no formulário. Filtrar sempre por `business_id` da empresa ativa. Erros de triggers são
  traduzidos para português (ver `taskErrorMessage` em `modules/tasks/actions.ts`).
- Datas: a BD guarda UTC; converter com `zonedDateTimeToUtc`/`splitZonedDateTime`/`dayRange` no fuso
  `business.timezone`. "Agora" nos componentes: `requestTime()`.
- Dinheiro em cêntimos (inteiros). Nunca dados fictícios; funcionalidades futuras dizem "chega na Fase N".
- Filtros das listas vivem no URL (parâmetros em português: `q`, `estado`, `pagina`...), validados com
  `getParam`/`getEnumParam`; valores inválidos são ignorados.

## Base de dados e segurança

- Todas as tabelas têm `business_id` + RLS com `private.user_business_ids()` / `user_business_ids_with_role()`.
- FKs compostas `(business_id, x_id)` impedem ligações entre empresas. Regras de negócio em triggers
  (ex.: colaborador só muda estado/notas; propriedade arquivada não recebe tarefas; a lista do modelo é copiada
  para a tarefa ao criar; inspeções têm registo criado automaticamente e o tipo não muda).
- Nunca usar `service_role` na app. Storage privado, caminho começa por `business_id`.
- Alterações de esquema: sempre nova migração (`npx supabase migration new nome`) + teste pgTAP + `npm run db:types`.
- Produção: o workflow `deploy-migrations.yml` aplica migrações ao fazer merge na `main`.

## Comandos

`npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run build` · `npm run format` ·
`npm run test:db` (precisa de `npx supabase start`) · `npm run test:e2e` (Playwright em `e2e/`, após build) · `npm run db:reset` · `npm run db:types`.
Antes de um PR: format, lint, typecheck, test, test:db, build, test:e2e (o CI corre o mesmo).

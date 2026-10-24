# Publicar o StayFlow (guia passo a passo)

Este guia leva-o do código no GitHub até à aplicação a funcionar num endereço público, com emails em português.
Não precisa de instalar nada no computador: tudo é feito nos sites do Supabase, do GitHub e da Vercel.

Tempo estimado: 45 a 60 minutos. Custos: os planos gratuitos do Supabase, da Vercel e do Resend chegam para
começar. Para clientes reais, recomenda-se o plano Pro do Supabase (cópias de segurança diárias e o projeto não
é pausado por inatividade).

Vai precisar de:

- uma conta no [GitHub](https://github.com) com acesso ao repositório `stayflow`;
- uma conta no [Supabase](https://supabase.com) (pode entrar com o GitHub);
- uma conta na [Vercel](https://vercel.com) (pode entrar com o GitHub);
- uma conta num serviço de envio de email, por exemplo o [Resend](https://resend.com);
- opcional, mas recomendado: um domínio próprio (ex.: `stayflow.pt`) onde possa criar registos DNS.

Ao longo do guia, substitua `https://app.stayflow.pt` pelo endereço real da sua aplicação. Se ainda não tem
domínio, use o endereço que a Vercel lhe dá (ex.: `https://stayflow.vercel.app`) e troque-o mais tarde.

> Regra de ouro: a chave `service_role` / `sb_secret_...` e a palavra-passe da base de dados **nunca** vão para
> o código, para a Vercel, para um chat ou para variáveis que começam por `NEXT_PUBLIC_`. A aplicação não
> precisa delas.

---

## 1. Criar o projeto Supabase

1. Em [supabase.com/dashboard](https://supabase.com/dashboard), clique em **New project**.
2. Nome: `stayflow`. Região: **Central EU (Frankfurt)** (fica perto de Portugal e dentro da UE).
3. Clique em **Generate a password**, copie a palavra-passe para um gestor de palavras-passe e crie o projeto.
4. Quando o projeto estiver pronto, copie o **project ref**: é o código no endereço do painel,
   `supabase.com/dashboard/project/<project ref>`.

Se este projeto já existe (o workflow de migrações já tem um _project ref_ configurado), salte para o passo 2.

## 2. Criar as tabelas (migrações automáticas)

As tabelas, regras de segurança (RLS) e o armazenamento de ficheiros são criados pelas migrações em
`supabase/migrations/`. O GitHub aplica-as sozinho sempre que há alterações na `main`.

1. **Token do Supabase:** em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens),
   clique em **Generate new token**, dê o nome `github-actions` e copie o valor.
2. **Secrets no GitHub:** no repositório, abra **Settings → Secrets and variables → Actions → New repository
   secret** e crie:
   - `SUPABASE_ACCESS_TOKEN` = o token do ponto anterior;
   - `SUPABASE_DB_PASSWORD` = a palavra-passe da base de dados do passo 1.
3. **Project ref:** confirme que `SUPABASE_PROJECT_REF` em `.github/workflows/deploy-migrations.yml` é o do seu
   projeto. Se não for, altere-o num pull request.
4. **Correr:** em **Actions → Migrações (produção) → Run workflow**, escolha `main` e clique em **Run workflow**.
   Deve terminar com um visto verde.
5. **Confirmar:** no Supabase, abra **Table Editor**. Devem aparecer tabelas como `businesses`, `properties`,
   `tasks` e `expenses`. Em **Storage** deve existir o bucket privado `attachments`.

Se o workflow falhar com "Faltam os secrets", reveja o ponto 2. Se falhar no `link`, o _project ref_ ou o token
estão errados.

## 3. Configurar a autenticação

No painel do Supabase, em **Authentication**:

1. **URL Configuration**
   - _Site URL_: `https://app.stayflow.pt`
   - _Redirect URLs_: adicione `https://app.stayflow.pt/**`. Se também usar o endereço da Vercel, adicione
     `https://stayflow.vercel.app/**`. (As pré-visualizações da Vercel têm endereços aleatórios; para testar
     registos nelas, adicione `https://*-<a-sua-conta>.vercel.app/**`.)
2. **Sign In / Providers → Email**: ative **Enable Email provider** e **Confirm email**. Desative os outros
   fornecedores (Google, etc.), que a aplicação não usa.
3. **Passwords** (ou _Password security_): comprimento mínimo **8** e exigir **letras e números**, como a
   aplicação já valida. Ative **Prevent use of leaked passwords** se o seu plano o permitir.
4. **Rate limits**: os valores por omissão servem. Depois do passo 4 (SMTP) pode subir o limite de emails por
   hora.

## 4. Emails em português e SMTP

O servidor de email incluído no Supabase envia muito poucos emails por hora e só para a equipa do projeto. Para
clientes reais tem de configurar um fornecedor.

### 4.1 Fornecedor de email (exemplo com o Resend)

1. No [Resend](https://resend.com), em **Domains → Add domain**, adicione o seu domínio (ex.: `stayflow.pt`).
2. Crie no seu fornecedor de DNS os registos que o Resend mostra (SPF, DKIM e, recomendado, DMARC) e espere até
   o domínio ficar **Verified**.
3. Em **API Keys → Create API key**, crie uma chave com permissão _Sending access_ e copie-a.

### 4.2 SMTP no Supabase

Em **Authentication → Emails → SMTP Settings**, ative **Enable custom SMTP** e preencha:

| Campo        | Valor (Resend)                |
| ------------ | ----------------------------- |
| Sender email | `nao-responder@stayflow.pt`   |
| Sender name  | `StayFlow`                    |
| Host         | `smtp.resend.com`             |
| Port         | `465`                         |
| Username     | `resend`                      |
| Password     | a chave API do passo anterior |

Outros fornecedores (Postmark, Brevo, Amazon SES) funcionam da mesma forma: use os dados SMTP que eles indicam.

### 4.3 Modelos de email

Em **Authentication → Emails → Templates**, para cada modelo copie o assunto e o conteúdo do ficheiro
correspondente (abra o ficheiro no GitHub, clique em **Raw**, selecione tudo e copie):

| Modelo no Supabase | Assunto                        | Ficheiro                               |
| ------------------ | ------------------------------ | -------------------------------------- |
| Confirm signup     | `Confirme o seu email`         | `supabase/templates/confirmation.html` |
| Reset password     | `Recuperar palavra-passe`      | `supabase/templates/recovery.html`     |
| Change email       | `Confirmar alteração de email` | `supabase/templates/email_change.html` |

Os convites para a equipa não usam email: o administrador copia o link do convite em **Definições → Equipa** e
envia-o por onde quiser (WhatsApp, email pessoal...).

## 5. Publicar na Vercel

1. Em [vercel.com/new](https://vercel.com/new), clique em **Import** ao lado do repositório `stayflow`. (Se não
   aparecer, clique em **Adjust GitHub App Permissions** e dê acesso ao repositório.)
2. _Framework Preset_: **Next.js** (é detetado sozinho). Não altere os comandos de build.
3. Abra **Environment Variables** e adicione:

   | Nome                                   | Onde encontrar                                                                        |
   | -------------------------------------- | ------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → **Project Settings → Data API** → _Project URL_                            |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys** → _Publishable key_ (`sb_publishable_...`) |
   | `NEXT_PUBLIC_SITE_URL`                 | O endereço público, sem barra no fim (ex.: `https://app.stayflow.pt`)                 |
   | `NEXT_PUBLIC_APP_NAME`                 | Opcional. Nome do produto (por omissão `StayFlow`)                                    |

4. Em **Settings → Functions** (depois de criar o projeto), escolha a região **Frankfurt (fra1)**, a mesma do
   Supabase, para a aplicação responder mais depressa.
5. Clique em **Deploy**. Ao fim de 2 a 3 minutos tem um endereço `https://stayflow-....vercel.app`.

As variáveis `NEXT_PUBLIC_*` são lidas durante o build: se mudar alguma, faça **Deployments → ⋯ → Redeploy**.

### Domínio próprio (opcional)

1. Na Vercel, em **Settings → Domains**, adicione `app.stayflow.pt` e crie no DNS o registo que a Vercel indica
   (normalmente um `CNAME` para `cname.vercel-dns.com`). O certificado HTTPS é automático.
2. Atualize `NEXT_PUBLIC_SITE_URL` na Vercel e faça **Redeploy**.
3. Atualize _Site URL_ e _Redirect URLs_ no Supabase (passo 3).

## 6. Verificar que tudo funciona

Faça este teste com um email real seu, numa janela privada do browser:

1. Abra o endereço público e clique em **Criar conta**. Deve receber o email "Confirme o seu email", em
   português, vindo do seu domínio.
2. Clique no link. Deve entrar na aplicação e ver o ecrã para criar a empresa.
3. Crie a empresa, uma propriedade e uma tarefa. Envie uma fotografia numa tarefa.
4. Em **Definições → Equipa**, crie um convite como colaborador, abra o link noutra janela privada e aceite-o
   com outra conta. O colaborador não deve conseguir criar tarefas nem ver despesas.
5. Termine a sessão e use **Esqueci-me da palavra-passe**. Deve receber o email "Recuperar palavra-passe".

Se um link de email abrir uma página de erro ou voltar ao login, quase sempre é o _Site URL_ ou os _Redirect URLs_
(passo 3) que não coincidem com `NEXT_PUBLIC_SITE_URL`.

## 7. Depois de publicar

- **Atualizações:** cada merge na `main` publica a aplicação na Vercel e aplica as migrações novas no Supabase.
  Cada pull request recebe um endereço de pré-visualização da Vercel (que usa a base de dados de produção: teste
  com cuidado).
- **Cópias de segurança:** no plano Pro, o Supabase faz cópias diárias (**Database → Backups**). No plano
  gratuito, não há; faça uma exportação manual com regularidade ou passe ao Pro antes de ter clientes.
- **Segurança:** veja **Advisors → Security Advisor** no Supabase depois de cada migração; não deve haver avisos
  vermelhos.
- **Erros:** os erros do servidor aparecem na Vercel em **Logs**. Os da base de dados e da autenticação no
  Supabase em **Logs**.

## Resolução de problemas

| Sintoma                                    | Causa provável e solução                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Página "Configuração em falta" ou erro 500 | Falta uma variável `NEXT_PUBLIC_*` na Vercel. Adicione-a e faça Redeploy.         |
| O email de confirmação não chega           | SMTP mal configurado ou domínio não verificado. Veja **Logs → Auth** no Supabase. |
| O email chega em inglês                    | Os modelos do passo 4.3 não foram copiados.                                       |
| O link do email leva ao login com erro     | _Redirect URLs_ não inclui o endereço da aplicação seguido de `/**`.              |
| "relation ... does not exist"              | As migrações não foram aplicadas. Corra o workflow do passo 2.                    |
| Os anexos não abrem                        | O bucket `attachments` não existe: as migrações não correram até ao fim.          |

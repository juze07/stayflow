-- =============================================================================
-- StayFlow: núcleo multiempresa
-- Perfis, empresas, membros e convites, mais as funções auxiliares usadas por
-- todas as políticas RLS.
--
-- Regra de ouro: todas as tabelas com dados de clientes têm `business_id` e RLS
-- ativo. As políticas usam `private.user_business_ids()`, que devolve as
-- empresas de que o utilizador autenticado é membro ativo.
-- =============================================================================

-- Esquema não exposto pela API REST: guarda funções internas.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Funções genéricas de triggers
-- -----------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Impede que uma linha "mude de empresa" depois de criada.
create or replace function private.prevent_business_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '' check (char_length(email) <= 254),
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 30),
  avatar_path text check (char_length(avatar_path) <= 500),
  last_business_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Dados públicos de cada utilizador, visíveis para colegas da mesma empresa.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Cria o perfil automaticamente no registo.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Mantém o email do perfil sincronizado com o da conta.
create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Empresas
-- -----------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  tax_id text check (char_length(tax_id) <= 20),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 30),
  address_line text check (char_length(address_line) <= 200),
  postal_code text check (char_length(postal_code) <= 12),
  city text check (char_length(city) <= 100),
  country_code char(2) not null default 'PT',
  timezone text not null default 'Europe/Lisbon' check (char_length(timezone) <= 64),
  locale text not null default 'pt-PT' check (char_length(locale) <= 10),
  currency char(3) not null default 'EUR',
  logo_path text check (char_length(logo_path) <= 500),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function private.set_updated_at();

alter table public.profiles
  add constraint profiles_last_business_id_fkey
  foreign key (last_business_id) references public.businesses (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Membros (quem pertence a que empresa, e com que função)
-- -----------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'staff')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function private.set_updated_at();

create trigger memberships_prevent_business_change
  before update on public.memberships
  for each row execute function private.prevent_business_change();

-- -----------------------------------------------------------------------------
-- Funções auxiliares de autorização (usadas pelas políticas RLS)
-- SECURITY DEFINER para poderem ler `memberships` sem recursão de políticas.
-- -----------------------------------------------------------------------------

create or replace function private.user_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.business_id
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active';
$$;

create or replace function private.user_business_ids_with_role(p_roles text[])
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.business_id
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role = any (p_roles);
$$;

create or replace function private.has_role(p_business_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.business_id = p_business_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

revoke all on function private.user_business_ids() from public;
revoke all on function private.user_business_ids_with_role(text[]) from public;
revoke all on function private.has_role(uuid, text[]) from public;
grant execute on function private.user_business_ids() to authenticated, service_role;
grant execute on function private.user_business_ids_with_role(text[]) to authenticated, service_role;
grant execute on function private.has_role(uuid, text[]) to authenticated, service_role;

-- Uma empresa nunca pode ficar sem nenhum administrador ativo.
create or replace function private.ensure_business_has_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.businesses b where b.id = old.business_id)
     and not exists (
       select 1
       from public.memberships m
       where m.business_id = old.business_id
         and m.role = 'admin'
         and m.status = 'active'
     ) then
    raise exception 'business must keep at least one active admin' using errcode = 'P0001';
  end if;
  return null;
end;
$$;

create trigger memberships_ensure_admin
  after update or delete on public.memberships
  for each row execute function private.ensure_business_has_admin();

-- -----------------------------------------------------------------------------
-- Convites
-- O convite gera um link que o administrador partilha (ex.: WhatsApp).
-- Só a conta com o email convidado o pode aceitar.
-- -----------------------------------------------------------------------------

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null check (
    email = lower(btrim(email))
    and char_length(email) <= 254
    and position('@' in email) > 1
  ),
  role text not null check (role in ('admin', 'manager', 'staff')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references public.profiles (id) on delete set null default auth.uid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Só um convite pendente por email e empresa.
create unique index invitations_one_pending_per_email
  on public.invitations (business_id, email)
  where accepted_at is null and revoked_at is null;

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function private.set_updated_at();

create trigger invitations_prevent_business_change
  before update on public.invitations
  for each row execute function private.prevent_business_change();

-- -----------------------------------------------------------------------------
-- RLS do núcleo
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

-- Perfis: o próprio, e colegas de empresas em comum.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or id in (
      select m.user_id
      from public.memberships m
      where m.business_id in (select private.user_business_ids())
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (last_business_id is null or last_business_id in (select private.user_business_ids()))
  );

-- Empresas: membros leem, só administradores alteram. A criação passa pela
-- função `create_business`, para criar empresa e administrador de uma só vez.
create policy businesses_select on public.businesses
  for select to authenticated
  using (id in (select private.user_business_ids()));

create policy businesses_update_admin on public.businesses
  for update to authenticated
  using (id in (select private.user_business_ids_with_role(array['admin'])))
  with check (id in (select private.user_business_ids_with_role(array['admin'])));

-- Membros: colegas veem-se entre si; só administradores alteram ou removem.
-- Novos membros entram apenas por `create_business` ou `accept_invitation`.
create policy memberships_select on public.memberships
  for select to authenticated
  using (business_id in (select private.user_business_ids()));

create policy memberships_update_admin on public.memberships
  for update to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin'])))
  with check (business_id in (select private.user_business_ids_with_role(array['admin'])));

create policy memberships_delete_admin on public.memberships
  for delete to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin'])));

-- Convites: administradores e gestores; só administradores convidam administradores.
create policy invitations_select on public.invitations
  for select to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    and (role <> 'admin' or business_id in (select private.user_business_ids_with_role(array['admin'])))
    and invited_by = (select auth.uid())
    and accepted_at is null
    and accepted_by is null
  );

create policy invitations_update on public.invitations
  for update to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])))
  with check (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    and (role <> 'admin' or business_id in (select private.user_business_ids_with_role(array['admin'])))
  );

-- -----------------------------------------------------------------------------
-- Funções públicas (RPC) dos convites
-- -----------------------------------------------------------------------------

-- Mostra o essencial de um convite a quem tem o link, sem expor mais nada.
create or replace function public.get_invitation(p_token uuid)
returns table (
  business_name text,
  email text,
  role text,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.name,
    i.email,
    i.role,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at < now() then 'expired'
      else 'pending'
    end
  from public.invitations i
  join public.businesses b on b.id = i.business_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invitation public.invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_user_id;

  select * into v_invitation
  from public.invitations i
  where i.token = p_token
  for update;

  if not found
     or v_invitation.revoked_at is not null
     or v_invitation.accepted_at is not null
     or v_invitation.expires_at < now() then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;

  if v_invitation.email <> v_email then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  insert into public.memberships (business_id, user_id, role)
  values (v_invitation.business_id, v_user_id, v_invitation.role)
  on conflict (business_id, user_id)
    do update set role = excluded.role, status = 'active';

  update public.invitations
  set accepted_at = now(), accepted_by = v_user_id
  where id = v_invitation.id;

  update public.profiles
  set last_business_id = v_invitation.business_id
  where id = v_user_id;

  return v_invitation.business_id;
end;
$$;

revoke all on function public.get_invitation(uuid) from public, anon;
revoke all on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.get_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- O papel anónimo não precisa de nenhuma tabela do esquema público.
revoke all on public.profiles, public.businesses, public.memberships, public.invitations from anon;

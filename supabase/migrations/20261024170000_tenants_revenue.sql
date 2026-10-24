-- =============================================================================
-- StayFlow: inquilinos (portal do hóspede), pagamentos e receitas.
--
-- O inquilino NÃO é membro da empresa: não tem linha em `memberships`, por isso
-- nenhuma política existente lhe dá acesso a dados da empresa. Tudo o que vê
-- ou faz passa por funções RPC (SECURITY DEFINER) que filtram pelas estadias
-- ligadas à sua conta (`stays.tenant_user_id = auth.uid()`).
--
-- Pagamentos: registo manual (por receber / recebido). Não há integração com
-- nenhum prestador de pagamentos; o inquilino apenas informa que pagou e a
-- empresa confirma.
-- =============================================================================

-- Instruções de pagamento mostradas ao inquilino (ex.: IBAN, MB WAY).
alter table public.businesses
  add column payment_instructions text check (char_length(payment_instructions) <= 1000);

-- -----------------------------------------------------------------------------
-- Estadias (reserva ou arrendamento de uma propriedade por um inquilino)
-- -----------------------------------------------------------------------------

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  property_id uuid not null,
  guest_name text not null check (char_length(btrim(guest_name)) between 1 and 120),
  guest_email text not null check (
    guest_email = lower(btrim(guest_email))
    and char_length(guest_email) <= 254
    and position('@' in guest_email) > 1
  ),
  guest_phone text check (char_length(guest_phone) <= 30),
  starts_on date not null,
  -- Sem data de fim: arrendamento sem termo definido.
  ends_on date,
  notes text check (char_length(notes) <= 4000),
  -- Ligação à conta do inquilino: só `accept_stay_invitation` a define.
  invite_token uuid not null unique default gen_random_uuid(),
  tenant_user_id uuid references public.profiles (id) on delete set null,
  invite_accepted_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  constraint stays_dates check (ends_on is null or ends_on >= starts_on),
  foreign key (business_id, property_id) references public.properties (business_id, id)
);

create index stays_business_starts_idx on public.stays (business_id, starts_on desc);
create index stays_property_idx on public.stays (property_id, starts_on desc);
create index stays_tenant_idx on public.stays (tenant_user_id) where tenant_user_id is not null;

-- -----------------------------------------------------------------------------
-- Pagamentos (receitas). Valores em cêntimos.
-- -----------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  property_id uuid not null,
  stay_id uuid,
  description text not null check (char_length(btrim(description)) between 1 and 200),
  amount_cents integer not null check (amount_cents > 0 and amount_cents < 100000000),
  due_on date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_on date,
  method text check (method in ('transfer', 'mbway', 'cash', 'card', 'platform', 'other')),
  -- Preenchidos pelo inquilino em `report_stay_payment` ("já paguei").
  tenant_reported_at timestamptz,
  tenant_reference text check (char_length(tenant_reference) <= 200),
  notes text check (char_length(notes) <= 4000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  constraint payments_paid_consistency check ((status = 'paid') = (paid_on is not null)),
  foreign key (business_id, property_id) references public.properties (business_id, id),
  foreign key (business_id, stay_id) references public.stays (business_id, id) on delete set null (stay_id)
);

create index payments_business_due_idx on public.payments (business_id, status, due_on);
create index payments_business_paid_idx on public.payments (business_id, paid_on) where status = 'paid';
create index payments_stay_idx on public.payments (stay_id) where stay_id is not null;

-- Problemas reportados pelo inquilino ficam ligados à estadia.
alter table public.maintenance_issues add column stay_id uuid;
alter table public.maintenance_issues
  add constraint maintenance_issues_stay_fkey
  foreign key (business_id, stay_id) references public.stays (business_id, id) on delete set null (stay_id);
create index maintenance_issues_stay_idx on public.maintenance_issues (stay_id) where stay_id is not null;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create trigger stays_set_updated_at before update on public.stays
  for each row execute function private.set_updated_at();
create trigger stays_prevent_business_change before update on public.stays
  for each row execute function private.prevent_business_change();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function private.set_updated_at();
create trigger payments_prevent_business_change before update on public.payments
  for each row execute function private.prevent_business_change();

-- SECURITY INVOKER de propósito: dentro das RPC (SECURITY DEFINER) o
-- `current_user` é o dono da função; pedidos diretos da API são `authenticated`.
-- Assim só as RPC podem ligar a conta do inquilino ou marcar "já paguei".
create or replace function private.stays_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.tenant_user_id := null;
      new.invite_accepted_at := null;
    elsif (new.tenant_user_id is not null and new.tenant_user_id is distinct from old.tenant_user_id)
       or (new.invite_accepted_at is not null and new.invite_accepted_at is distinct from old.invite_accepted_at) then
      raise exception 'stay_link_protected' using errcode = '42501';
    end if;
  end if;

  -- Desligar a conta (ou gerar novo link) volta a deixar o convite pendente.
  if new.tenant_user_id is null then
    new.invite_accepted_at := null;
  end if;

  return new;
end;
$$;

create trigger stays_before_write
  before insert or update on public.stays
  for each row execute function private.stays_before_write();

create or replace function private.payments_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_property uuid;
  v_timezone text;
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.tenant_reported_at := null;
      new.tenant_reference := null;
    elsif (new.tenant_reported_at is not null and new.tenant_reported_at is distinct from old.tenant_reported_at)
       or (new.tenant_reference is not null and new.tenant_reference is distinct from old.tenant_reference) then
      raise exception 'payment_report_protected' using errcode = '42501';
    end if;
  end if;

  -- O pagamento de uma estadia é sempre da propriedade dessa estadia.
  if new.stay_id is not null then
    select s.property_id into v_property from public.stays s where s.id = new.stay_id;
    if new.property_id is null then
      new.property_id := v_property;
    elsif new.property_id is distinct from v_property then
      raise exception 'payment_property_mismatch' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'paid' then
    if new.paid_on is null then
      select b.timezone into v_timezone from public.businesses b where b.id = new.business_id;
      new.paid_on := (now() at time zone coalesce(v_timezone, 'Europe/Lisbon'))::date;
    end if;
  else
    new.paid_on := null;
  end if;

  return new;
end;
$$;

create trigger payments_before_write
  before insert or update on public.payments
  for each row execute function private.payments_before_write();

create or replace function private.maintenance_issues_validate_stay()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_property uuid;
begin
  if new.stay_id is not null
     and (tg_op = 'INSERT' or new.stay_id is distinct from old.stay_id or new.property_id is distinct from old.property_id) then
    select s.property_id into v_property from public.stays s where s.id = new.stay_id;
    if v_property is distinct from new.property_id then
      raise exception 'stay_property_mismatch' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger maintenance_issues_validate_stay
  before insert or update on public.maintenance_issues
  for each row execute function private.maintenance_issues_validate_stay();

-- -----------------------------------------------------------------------------
-- RLS: estadias e pagamentos só para administradores e gestores.
-- Os inquilinos não têm políticas: usam apenas as RPC abaixo.
-- -----------------------------------------------------------------------------

alter table public.stays enable row level security;
alter table public.payments enable row level security;

create policy stays_all on public.stays
  for all to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])))
  with check (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

create policy payments_all on public.payments
  for all to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])))
  with check (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

-- Gestores veem o perfil (nome) dos inquilinos das suas estadias.
create policy profiles_select_tenants on public.profiles
  for select to authenticated
  using (id in (select s.tenant_user_id from public.stays s where s.tenant_user_id is not null));

revoke all on public.stays, public.payments from anon;

-- -----------------------------------------------------------------------------
-- Convite do inquilino
-- -----------------------------------------------------------------------------

create or replace function public.get_stay_invitation(p_token uuid)
returns table (
  business_name text,
  property_name text,
  guest_email text,
  starts_on date,
  ends_on date,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.name,
    p.name,
    s.guest_email,
    s.starts_on,
    s.ends_on,
    case
      when s.cancelled_at is not null then 'cancelled'
      when s.tenant_user_id is not null then 'accepted'
      else 'pending'
    end
  from public.stays s
  join public.businesses b on b.id = s.business_id
  join public.properties p on p.id = s.property_id
  where s.invite_token = p_token;
$$;

create or replace function public.accept_stay_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_stay public.stays%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_user_id;

  select * into v_stay from public.stays s where s.invite_token = p_token for update;

  if not found
     or v_stay.cancelled_at is not null
     or (v_stay.tenant_user_id is not null and v_stay.tenant_user_id <> v_user_id) then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;

  if v_stay.guest_email <> v_email then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  update public.stays
  set tenant_user_id = v_user_id, invite_accepted_at = coalesce(invite_accepted_at, now())
  where id = v_stay.id;

  return v_stay.id;
end;
$$;

-- Convites de estadia pendentes para o email da conta (ecrã de onboarding).
create or replace function public.my_pending_stay_invitations()
returns table (token uuid, business_name text, property_name text, starts_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select s.invite_token, b.name, p.name, s.starts_on
  from public.stays s
  join public.businesses b on b.id = s.business_id
  join public.properties p on p.id = s.property_id
  join auth.users u on u.id = (select auth.uid())
  where s.guest_email = lower(u.email)
    and s.tenant_user_id is null
    and s.cancelled_at is null
  order by s.starts_on desc;
$$;

-- -----------------------------------------------------------------------------
-- Portal do inquilino: apenas as estadias ligadas à conta autenticada.
-- -----------------------------------------------------------------------------

create or replace function public.my_stays()
returns table (
  stay_id uuid,
  business_name text,
  business_email text,
  business_phone text,
  business_timezone text,
  payment_instructions text,
  property_name text,
  address_line text,
  postal_code text,
  city text,
  access_instructions text,
  guest_name text,
  starts_on date,
  ends_on date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    b.name,
    b.email,
    b.phone,
    b.timezone,
    b.payment_instructions,
    p.name,
    p.address_line,
    p.postal_code,
    p.city,
    -- Instruções de acesso só a partir da véspera da entrada e até à saída.
    case
      when (now() at time zone b.timezone)::date between s.starts_on - 1 and coalesce(s.ends_on, 'infinity'::date)
        then p.access_instructions
    end,
    s.guest_name,
    s.starts_on,
    s.ends_on
  from public.stays s
  join public.businesses b on b.id = s.business_id
  join public.properties p on p.id = s.property_id
  where s.tenant_user_id = (select auth.uid())
    and s.cancelled_at is null
  order by s.starts_on desc;
$$;

create or replace function public.my_stay_payments()
returns table (
  payment_id uuid,
  stay_id uuid,
  description text,
  amount_cents integer,
  due_on date,
  status text,
  paid_on date,
  tenant_reported_at timestamptz,
  tenant_reference text
)
language sql
stable
security definer
set search_path = ''
as $$
  select pm.id, pm.stay_id, pm.description, pm.amount_cents, pm.due_on, pm.status, pm.paid_on,
         pm.tenant_reported_at, pm.tenant_reference
  from public.payments pm
  join public.stays s on s.id = pm.stay_id
  where s.tenant_user_id = (select auth.uid())
    and s.cancelled_at is null
    and pm.status <> 'cancelled'
  order by pm.due_on, pm.created_at;
$$;

-- "Já paguei": avisa a empresa, que confirma o recebimento.
create or replace function public.report_stay_payment(p_payment_id uuid, p_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if char_length(v_reference) > 200 then
    raise exception 'reference_too_long' using errcode = '22023';
  end if;

  update public.payments pm
  set tenant_reported_at = now(), tenant_reference = v_reference
  from public.stays s
  where pm.id = p_payment_id
    and s.id = pm.stay_id
    and s.tenant_user_id = auth.uid()
    and s.cancelled_at is null
    and pm.status = 'pending';

  if not found then
    raise exception 'payment_not_found' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.my_stay_issues()
returns table (
  issue_id uuid,
  stay_id uuid,
  title text,
  category text,
  status text,
  reported_at timestamptz,
  resolved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.stay_id, i.title, i.category, i.status, i.reported_at, i.resolved_at
  from public.maintenance_issues i
  join public.stays s on s.id = i.stay_id
  where s.tenant_user_id = (select auth.uid())
    and s.cancelled_at is null
  order by i.reported_at desc;
$$;

-- Cria um problema na Manutenção da empresa, ligado à estadia.
create or replace function public.report_stay_issue(
  p_stay_id uuid,
  p_title text,
  p_description text,
  p_category text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stay public.stays%rowtype;
  v_issue_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_stay
  from public.stays s
  where s.id = p_stay_id and s.tenant_user_id = v_user_id and s.cancelled_at is null;
  if not found then
    raise exception 'stay_not_found' using errcode = 'P0001';
  end if;

  -- Limite simples contra abuso: 10 problemas por estadia em 24 horas.
  if (
    select count(*) from public.maintenance_issues i
    where i.stay_id = v_stay.id and i.reported_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'too_many_reports' using errcode = 'P0001';
  end if;

  insert into public.maintenance_issues (business_id, property_id, stay_id, title, description, category, reported_by)
  values (
    v_stay.business_id,
    v_stay.property_id,
    v_stay.id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_category,
    v_user_id
  )
  returning id into v_issue_id;

  return v_issue_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Relatório de resultados: receitas recebidas vs despesas, por mês e
-- propriedade. SECURITY INVOKER: o RLS limita a administradores e gestores.
-- -----------------------------------------------------------------------------

create or replace function public.revenue_report(
  p_business_id uuid,
  p_from date,
  p_to date
)
returns table (month date, property_id uuid, revenue_cents bigint, expense_cents bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 1100 then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  return query
  with entries as (
    select date_trunc('month', pm.paid_on::timestamp)::date as entry_month, pm.property_id as entry_property,
           pm.amount_cents::bigint as revenue, 0::bigint as expense
    from public.payments pm
    where pm.business_id = p_business_id and pm.status = 'paid' and pm.paid_on between p_from and p_to
    union all
    select date_trunc('month', e.incurred_on::timestamp)::date, e.property_id, 0::bigint, e.amount_cents::bigint
    from public.expenses e
    where e.business_id = p_business_id and e.incurred_on between p_from and p_to
  )
  select entry_month, entry_property, sum(revenue)::bigint, sum(expense)::bigint
  from entries
  group by 1, 2
  order by 1, 2;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões das funções
-- -----------------------------------------------------------------------------

revoke all on function public.get_stay_invitation(uuid) from public, anon;
revoke all on function public.accept_stay_invitation(uuid) from public, anon;
revoke all on function public.my_pending_stay_invitations() from public, anon;
revoke all on function public.my_stays() from public, anon;
revoke all on function public.my_stay_payments() from public, anon;
revoke all on function public.report_stay_payment(uuid, text) from public, anon;
revoke all on function public.my_stay_issues() from public, anon;
revoke all on function public.report_stay_issue(uuid, text, text, text) from public, anon;
revoke all on function public.revenue_report(uuid, date, date) from public, anon;

grant execute on function public.get_stay_invitation(uuid) to authenticated;
grant execute on function public.accept_stay_invitation(uuid) to authenticated;
grant execute on function public.my_pending_stay_invitations() to authenticated;
grant execute on function public.my_stays() to authenticated;
grant execute on function public.my_stay_payments() to authenticated;
grant execute on function public.report_stay_payment(uuid, text) to authenticated;
grant execute on function public.my_stay_issues() to authenticated;
grant execute on function public.report_stay_issue(uuid, text, text, text) to authenticated;
grant execute on function public.revenue_report(uuid, date, date) to authenticated;

-- =============================================================================
-- StayFlow: pagamentos online com Stripe Connect.
--
-- Cada empresa liga a sua própria conta Stripe (conta ligada). O dinheiro vai
-- diretamente para essa conta: a plataforma nunca o recebe.
--
-- - Cartão: Stripe Checkout na conta da empresa.
-- - Transferência: cada estadia tem um cliente Stripe com um IBAN virtual só
--   seu ("Bank transfers" / saldo do cliente). O que chega a esse IBAN é
--   associado automaticamente aos pagamentos por receber da estadia.
--
-- Escritas vindas da Stripe (webhook) não têm sessão de utilizador e a app
-- nunca usa `service_role`. Por isso passam por funções SECURITY DEFINER que
-- exigem um segredo partilhado (`STRIPE_DB_SECRET`, só no servidor). Na base de
-- dados guarda-se apenas o hash SHA-256 desse segredo.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Segredo das integrações
-- -----------------------------------------------------------------------------

create table private.integration_secrets (
  name text primary key,
  secret_hash text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);

revoke all on private.integration_secrets from public, anon, authenticated;

-- Definido uma vez por ambiente, no editor SQL do Supabase:
--   select private.set_integration_secret('stripe', '<o mesmo valor de STRIPE_DB_SECRET>');
create or replace function private.set_integration_secret(p_name text, p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(coalesce(p_secret, '')) < 32 then
    raise exception 'secret_too_short' using errcode = '22023';
  end if;
  insert into private.integration_secrets (name, secret_hash)
  values (p_name, encode(extensions.digest(p_secret, 'sha256'), 'hex'))
  on conflict (name) do update set secret_hash = excluded.secret_hash, updated_at = now();
end;
$$;

revoke all on function private.set_integration_secret(text, text) from public, anon, authenticated;

create or replace function private.require_stripe_secret(p_secret text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if char_length(coalesce(p_secret, '')) < 32 or not exists (
    select 1 from private.integration_secrets s
    where s.name = 'stripe' and s.secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'invalid_secret' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_stripe_secret(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

-- Conta Stripe ligada de cada empresa.
create table public.stripe_accounts (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  account_id text not null unique check (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'),
  charges_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cliente Stripe (na conta da empresa) e IBAN virtual de cada estadia.
create table public.stay_bank_accounts (
  stay_id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id text not null unique check (customer_id ~ '^cus_[A-Za-z0-9]{1,64}$'),
  iban text check (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,30}$'),
  bic text check (char_length(bic) <= 11),
  bank_name text check (char_length(bank_name) <= 200),
  account_holder_name text check (char_length(account_holder_name) <= 200),
  country text check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, stay_id) references public.stays (business_id, id) on delete cascade
);

alter table public.payments
  add column stripe_payment_intent_id text unique check (stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]{1,64}$');

-- Eventos da Stripe já processados (idempotência do webhook).
create table private.stripe_events (
  id text primary key check (id ~ '^evt_[A-Za-z0-9]{1,64}$'),
  type text not null,
  processed_at timestamptz not null default now()
);

revoke all on private.stripe_events from public, anon, authenticated;

create trigger stripe_accounts_set_updated_at before update on public.stripe_accounts
  for each row execute function private.set_updated_at();
create trigger stay_bank_accounts_set_updated_at before update on public.stay_bank_accounts
  for each row execute function private.set_updated_at();

-- A ligação de um pagamento à Stripe só é feita pelas funções abaixo.
create or replace function private.payments_protect_stripe()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.stripe_payment_intent_id := null;
    elsif new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id then
      raise exception 'payment_stripe_protected' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger payments_protect_stripe
  before insert or update on public.payments
  for each row execute function private.payments_protect_stripe();

-- -----------------------------------------------------------------------------
-- RLS: administradores e gestores leem; ninguém escreve pela API.
-- -----------------------------------------------------------------------------

alter table public.stripe_accounts enable row level security;
alter table public.stay_bank_accounts enable row level security;

create policy stripe_accounts_select on public.stripe_accounts
  for select to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

create policy stay_bank_accounts_select on public.stay_bank_accounts
  for select to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

revoke all on public.stripe_accounts, public.stay_bank_accounts from anon;
revoke insert, update, delete on public.stripe_accounts, public.stay_bank_accounts from authenticated;

-- -----------------------------------------------------------------------------
-- Portal do inquilino: opções de pagamento online das suas estadias.
-- -----------------------------------------------------------------------------

create or replace function public.my_stay_payment_options()
returns table (
  stay_id uuid,
  online_payments boolean,
  iban text,
  bic text,
  bank_name text,
  account_holder_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, coalesce(a.charges_enabled, false), ba.iban, ba.bic, ba.bank_name, ba.account_holder_name
  from public.stays s
  left join public.stripe_accounts a on a.business_id = s.business_id
  left join public.stay_bank_accounts ba on ba.stay_id = s.id
  where s.tenant_user_id = (select auth.uid())
    and s.cancelled_at is null;
$$;

-- -----------------------------------------------------------------------------
-- Funções do servidor (webhook e ações), protegidas pelo segredo.
-- -----------------------------------------------------------------------------

-- Guarda a conta ligada da empresa. Nunca substitui uma conta já guardada:
-- devolve a que ficou registada.
create or replace function public.stripe_save_account(p_secret text, p_business_id uuid, p_account_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account text;
begin
  perform private.require_stripe_secret(p_secret);
  insert into public.stripe_accounts (business_id, account_id)
  values (p_business_id, p_account_id)
  on conflict (business_id) do nothing;
  select a.account_id into v_account from public.stripe_accounts a where a.business_id = p_business_id;
  return v_account;
end;
$$;

create or replace function public.stripe_update_account(
  p_secret text,
  p_account_id text,
  p_charges_enabled boolean,
  p_details_submitted boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  update public.stripe_accounts
  set charges_enabled = p_charges_enabled, details_submitted = p_details_submitted
  where account_id = p_account_id;
end;
$$;

create or replace function public.stripe_stay_context(p_secret text, p_stay_id uuid)
returns table (
  stay_id uuid,
  business_id uuid,
  account_id text,
  charges_enabled boolean,
  customer_id text,
  iban text,
  guest_name text,
  guest_email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  return query
  select s.id, s.business_id, a.account_id, coalesce(a.charges_enabled, false), ba.customer_id, ba.iban,
         s.guest_name, s.guest_email
  from public.stays s
  left join public.stripe_accounts a on a.business_id = s.business_id
  left join public.stay_bank_accounts ba on ba.stay_id = s.id
  where s.id = p_stay_id and s.cancelled_at is null;
end;
$$;

create or replace function public.stripe_payment_context(p_secret text, p_payment_id uuid)
returns table (
  payment_id uuid,
  stay_id uuid,
  business_id uuid,
  description text,
  amount_cents integer,
  status text,
  payment_intent_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  return query
  select pm.id, pm.stay_id, pm.business_id, pm.description, pm.amount_cents, pm.status, pm.stripe_payment_intent_id
  from public.payments pm
  where pm.id = p_payment_id;
end;
$$;

-- Guarda o cliente Stripe da estadia. Nunca substitui: devolve o que ficou.
create or replace function public.stripe_save_stay_customer(p_secret text, p_stay_id uuid, p_customer_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer text;
begin
  perform private.require_stripe_secret(p_secret);
  insert into public.stay_bank_accounts (stay_id, business_id, customer_id)
  select s.id, s.business_id, p_customer_id from public.stays s where s.id = p_stay_id
  on conflict (stay_id) do nothing;
  select ba.customer_id into v_customer from public.stay_bank_accounts ba where ba.stay_id = p_stay_id;
  if v_customer is null then
    raise exception 'stay_not_found' using errcode = 'P0001';
  end if;
  return v_customer;
end;
$$;

create or replace function public.stripe_save_stay_iban(
  p_secret text,
  p_stay_id uuid,
  p_iban text,
  p_bic text,
  p_bank_name text,
  p_account_holder_name text,
  p_country text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  update public.stay_bank_accounts
  set iban = p_iban, bic = nullif(p_bic, ''), bank_name = nullif(p_bank_name, ''),
      account_holder_name = nullif(p_account_holder_name, ''),
      country = p_country
  where stay_id = p_stay_id;
  if not found then
    raise exception 'stay_not_found' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.stripe_attach_payment_intent(p_secret text, p_payment_id uuid, p_payment_intent_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  update public.payments
  set stripe_payment_intent_id = p_payment_intent_id
  where id = p_payment_id and status = 'pending';
end;
$$;

-- Pagamentos por receber da estadia de um cliente Stripe, do mais antigo para
-- o mais recente (ordem pela qual o saldo recebido é aplicado).
create or replace function public.stripe_pending_payments_for_customer(
  p_secret text,
  p_account_id text,
  p_customer_id text
)
returns table (
  payment_id uuid,
  stay_id uuid,
  business_id uuid,
  description text,
  amount_cents integer,
  payment_intent_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  return query
  select pm.id, pm.stay_id, pm.business_id, pm.description, pm.amount_cents, pm.stripe_payment_intent_id
  from public.stay_bank_accounts ba
  join public.stripe_accounts a on a.business_id = ba.business_id
  join public.payments pm on pm.stay_id = ba.stay_id
  where ba.customer_id = p_customer_id
    and a.account_id = p_account_id
    and pm.status = 'pending'
  order by pm.due_on, pm.created_at;
end;
$$;

-- Marca um pagamento como recebido. Idempotente: repetir não altera nada.
-- Devolve paid | already_paid | not_pending | amount_mismatch | not_found.
create or replace function public.stripe_mark_payment_paid(
  p_secret text,
  p_account_id text,
  p_payment_id uuid,
  p_payment_intent_id text,
  p_amount_cents integer,
  p_method text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
begin
  perform private.require_stripe_secret(p_secret);
  if p_method not in ('card', 'transfer') then
    raise exception 'invalid_method' using errcode = '22023';
  end if;

  select pm.* into v_payment
  from public.payments pm
  join public.stripe_accounts a on a.business_id = pm.business_id
  where pm.id = p_payment_id and a.account_id = p_account_id
  for update of pm;

  if not found then
    return 'not_found';
  end if;
  if v_payment.status = 'paid' then
    return 'already_paid';
  end if;
  if v_payment.status <> 'pending' then
    return 'not_pending';
  end if;
  if p_amount_cents < v_payment.amount_cents then
    return 'amount_mismatch';
  end if;

  update public.payments
  set status = 'paid', method = p_method, stripe_payment_intent_id = p_payment_intent_id
  where id = v_payment.id;
  return 'paid';
end;
$$;

create or replace function public.stripe_event_processed(p_secret text, p_event_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  return exists (select 1 from private.stripe_events e where e.id = p_event_id);
end;
$$;

create or replace function public.stripe_record_event(p_secret text, p_event_id text, p_type text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_stripe_secret(p_secret);
  insert into private.stripe_events (id, type) values (p_event_id, left(p_type, 100))
  on conflict (id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões das funções. As `stripe_*` são chamadas sem sessão (webhook), por
-- isso estão disponíveis para `anon`; sem o segredo falham sempre.
-- -----------------------------------------------------------------------------

revoke all on function public.my_stay_payment_options() from public, anon;
grant execute on function public.my_stay_payment_options() to authenticated;

revoke all on function public.stripe_save_account(text, uuid, text) from public;
revoke all on function public.stripe_update_account(text, text, boolean, boolean) from public;
revoke all on function public.stripe_stay_context(text, uuid) from public;
revoke all on function public.stripe_payment_context(text, uuid) from public;
revoke all on function public.stripe_save_stay_customer(text, uuid, text) from public;
revoke all on function public.stripe_save_stay_iban(text, uuid, text, text, text, text, text) from public;
revoke all on function public.stripe_attach_payment_intent(text, uuid, text) from public;
revoke all on function public.stripe_pending_payments_for_customer(text, text, text) from public;
revoke all on function public.stripe_mark_payment_paid(text, text, uuid, text, integer, text) from public;
revoke all on function public.stripe_event_processed(text, text) from public;
revoke all on function public.stripe_record_event(text, text, text) from public;

grant execute on function public.stripe_save_account(text, uuid, text) to anon, authenticated;
grant execute on function public.stripe_update_account(text, text, boolean, boolean) to anon, authenticated;
grant execute on function public.stripe_stay_context(text, uuid) to anon, authenticated;
grant execute on function public.stripe_payment_context(text, uuid) to anon, authenticated;
grant execute on function public.stripe_save_stay_customer(text, uuid, text) to anon, authenticated;
grant execute on function public.stripe_save_stay_iban(text, uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.stripe_attach_payment_intent(text, uuid, text) to anon, authenticated;
grant execute on function public.stripe_pending_payments_for_customer(text, text, text) to anon, authenticated;
grant execute on function public.stripe_mark_payment_paid(text, text, uuid, text, integer, text) to anon, authenticated;
grant execute on function public.stripe_event_processed(text, text) to anon, authenticated;
grant execute on function public.stripe_record_event(text, text, text) to anon, authenticated;

-- Pagamentos online com Stripe Connect.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(29);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('b7777777-7777-7777-7777-777777777777', 'admin8@example.com', 'authenticated', 'authenticated', '{"full_name":"Admin"}'),
  ('b8888888-8888-8888-8888-888888888888', 'staff8@example.com', 'authenticated', 'authenticated', '{"full_name":"Staff"}'),
  ('b9999999-9999-9999-9999-999999999999', 'outro8@example.com', 'authenticated', 'authenticated', '{"full_name":"Outro"}'),
  ('bbbbbbbb-1111-1111-1111-111111111111', 'inquilino8@example.com', 'authenticated', 'authenticated', '{"full_name":"Inquilino"}');

create temp table ctx (key text primary key, val uuid not null);
grant all on ctx to authenticated, anon;
create function pg_temp.ctx(p_key text) returns uuid language sql stable as
  $$ select val from ctx where key = p_key $$;
create function pg_temp.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;
create function pg_temp.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

select private.set_integration_secret('stripe', 'segredo-de-teste-com-mais-de-32-caracteres');

select pg_temp.login('b9999999-9999-9999-9999-999999999999');
insert into ctx values ('other', public.create_business('Empresa Outra'));

select pg_temp.login('b7777777-7777-7777-7777-777777777777');
insert into ctx values ('b', public.create_business('Empresa Stripe'));
reset role;
insert into public.memberships (business_id, user_id, role)
values (pg_temp.ctx('b'), 'b8888888-8888-8888-8888-888888888888', 'staff');
select pg_temp.login('b7777777-7777-7777-7777-777777777777');

insert into public.properties (id, business_id, name, address_line, postal_code, city) values
  ('e0000000-0000-0000-0000-000000000001', pg_temp.ctx('b'), 'Casa S', 'Rua S', '1000-001', 'Lisboa');
insert into public.stays (id, business_id, property_id, guest_name, guest_email, starts_on)
values ('e0000000-0000-0000-0000-000000000011', pg_temp.ctx('b'), 'e0000000-0000-0000-0000-000000000001',
        'Inquilino', 'inquilino8@example.com', current_date);
insert into ctx select 'token', invite_token from public.stays where id = 'e0000000-0000-0000-0000-000000000011';
insert into public.payments (id, business_id, property_id, stay_id, description, amount_cents, due_on) values
  ('e0000000-0000-0000-0000-000000000021', pg_temp.ctx('b'), 'e0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000011', 'Renda outubro', 80000, current_date - 10),
  ('e0000000-0000-0000-0000-000000000022', pg_temp.ctx('b'), 'e0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000011', 'Renda novembro', 80000, current_date + 20);

select pg_temp.login('bbbbbbbb-1111-1111-1111-111111111111');
select public.accept_stay_invitation(pg_temp.ctx('token'));

-- Segredo ------------------------------------------------------------------

select pg_temp.anon();
select throws_ok(
  format($$select public.stripe_save_account('errado', %L, 'acct_1')$$, pg_temp.ctx('b')),
  '42501', 'invalid_secret',
  'sem o segredo certo nada é escrito'
);
select throws_ok(
  format($$select public.stripe_save_account('segredo-de-teste-com-mais-de-32-caracteresX', %L, 'acct_1')$$,
         pg_temp.ctx('b')),
  '42501', 'invalid_secret',
  'um segredo parecido também falha'
);
select throws_ok(
  $$select public.stripe_event_processed(null, 'evt_1')$$,
  '42501', 'invalid_secret',
  'segredo em falta falha'
);
select throws_ok(
  $$select * from public.my_stay_payment_options()$$,
  '42501', null,
  'sem sessão não há opções de pagamento do inquilino'
);
select throws_ok(
  $$select private.set_integration_secret('stripe', 'tentativa-de-trocar-o-segredo-por-outro')$$,
  '42501', null,
  'a API não troca o segredo'
);

-- Conta ligada --------------------------------------------------------------

select is(
  public.stripe_save_account('segredo-de-teste-com-mais-de-32-caracteres', pg_temp.ctx('b'), 'acct_Empresa1'),
  'acct_Empresa1',
  'guarda a conta Stripe da empresa'
);
select is(
  public.stripe_save_account('segredo-de-teste-com-mais-de-32-caracteres', pg_temp.ctx('b'), 'acct_Outra'),
  'acct_Empresa1',
  'nunca substitui uma conta já ligada'
);
select throws_ok(
  format($$select public.stripe_save_account('segredo-de-teste-com-mais-de-32-caracteres', %L, 'nao-e-conta')$$,
         pg_temp.ctx('other')),
  '23514', null,
  'só aceita identificadores de conta Stripe'
);

select pg_temp.login('b7777777-7777-7777-7777-777777777777');
select is(
  (select account_id from public.stripe_accounts where business_id = pg_temp.ctx('b')),
  'acct_Empresa1',
  'o administrador vê a conta ligada'
);
select throws_ok(
  $$update public.stripe_accounts set charges_enabled = true$$,
  '42501', null,
  'mas não a altera pela API'
);
select throws_ok(
  format($$insert into public.stripe_accounts (business_id, account_id) values (%L, 'acct_X')$$, pg_temp.ctx('b')),
  '42501', null,
  'nem cria contas pela API'
);
select throws_ok(
  $$update public.payments set stripe_payment_intent_id = 'pi_falso' where id = 'e0000000-0000-0000-0000-000000000021'$$,
  '42501', 'payment_stripe_protected',
  'o gestor não liga pagamentos à Stripe'
);

select pg_temp.login('b8888888-8888-8888-8888-888888888888');
select is((select count(*) from public.stripe_accounts), 0::bigint, 'o colaborador não vê a conta Stripe');

select pg_temp.login('b9999999-9999-9999-9999-999999999999');
select is((select count(*) from public.stripe_accounts), 0::bigint, 'outra empresa não vê a conta Stripe');

-- Inquilino: opções e IBAN --------------------------------------------------

select pg_temp.login('bbbbbbbb-1111-1111-1111-111111111111');
select is(
  (select online_payments from public.my_stay_payment_options()),
  false,
  'sem verificação concluída não há pagamentos online'
);

select pg_temp.anon();
select public.stripe_update_account('segredo-de-teste-com-mais-de-32-caracteres', 'acct_Empresa1', true, true);
select is(
  public.stripe_save_stay_customer('segredo-de-teste-com-mais-de-32-caracteres',
                                   'e0000000-0000-0000-0000-000000000011', 'cus_Inquilino1'),
  'cus_Inquilino1',
  'guarda o cliente Stripe da estadia'
);
select is(
  public.stripe_save_stay_customer('segredo-de-teste-com-mais-de-32-caracteres',
                                   'e0000000-0000-0000-0000-000000000011', 'cus_Outro'),
  'cus_Inquilino1',
  'nunca substitui o cliente da estadia'
);
select public.stripe_save_stay_iban('segredo-de-teste-com-mais-de-32-caracteres',
  'e0000000-0000-0000-0000-000000000011', 'NL91TEST0123456789', 'TESTNL2A', '', 'Empresa Stripe', 'NL');

select pg_temp.login('bbbbbbbb-1111-1111-1111-111111111111');
select results_eq(
  $$select online_payments, iban, bic, bank_name from public.my_stay_payment_options()$$,
  $$values (true, 'NL91TEST0123456789'::text, 'TESTNL2A'::text, null::text)$$,
  'o inquilino vê o seu IBAN depois de a empresa ser verificada'
);

select pg_temp.login('b9999999-9999-9999-9999-999999999999');
select is((select count(*) from public.my_stay_payment_options()), 0::bigint, 'outra pessoa não vê o IBAN');
select is((select count(*) from public.stay_bank_accounts), 0::bigint, 'nem a tabela de IBAN');

-- Pagamentos recebidos ------------------------------------------------------

select pg_temp.anon();
select results_eq(
  $$select payment_id from public.stripe_pending_payments_for_customer(
      'segredo-de-teste-com-mais-de-32-caracteres', 'acct_Empresa1', 'cus_Inquilino1')$$,
  $$values ('e0000000-0000-0000-0000-000000000021'::uuid), ('e0000000-0000-0000-0000-000000000022'::uuid)$$,
  'os pagamentos por receber vêm do mais antigo para o mais recente'
);
select is(
  (select count(*) from public.stripe_pending_payments_for_customer(
     'segredo-de-teste-com-mais-de-32-caracteres', 'acct_Outra', 'cus_Inquilino1')),
  0::bigint,
  'outra conta Stripe não vê os pagamentos da estadia'
);
select is(
  public.stripe_mark_payment_paid('segredo-de-teste-com-mais-de-32-caracteres', 'acct_Outra',
    'e0000000-0000-0000-0000-000000000021', 'pi_Teste1', 80000, 'transfer'),
  'not_found',
  'um pagamento de outra conta Stripe não é marcado'
);
select is(
  public.stripe_mark_payment_paid('segredo-de-teste-com-mais-de-32-caracteres', 'acct_Empresa1',
    'e0000000-0000-0000-0000-000000000021', 'pi_Teste1', 79999, 'transfer'),
  'amount_mismatch',
  'um valor inferior não marca o pagamento'
);
select is(
  public.stripe_mark_payment_paid('segredo-de-teste-com-mais-de-32-caracteres', 'acct_Empresa1',
    'e0000000-0000-0000-0000-000000000021', 'pi_Teste1', 80000, 'transfer'),
  'paid',
  'o pagamento fica recebido'
);
select is(
  public.stripe_mark_payment_paid('segredo-de-teste-com-mais-de-32-caracteres', 'acct_Empresa1',
    'e0000000-0000-0000-0000-000000000021', 'pi_Teste1', 80000, 'transfer'),
  'already_paid',
  'repetir o evento não altera nada'
);

select pg_temp.login('b7777777-7777-7777-7777-777777777777');
select results_eq(
  $$select status, method, stripe_payment_intent_id, paid_on is not null
    from public.payments where id = 'e0000000-0000-0000-0000-000000000021'$$,
  $$values ('paid'::text, 'transfer'::text, 'pi_Teste1'::text, true)$$,
  'o gestor vê o pagamento recebido por transferência, com data'
);

-- Idempotência do webhook ----------------------------------------------------

select pg_temp.anon();
select is(
  public.stripe_event_processed('segredo-de-teste-com-mais-de-32-caracteres', 'evt_Teste1'),
  false,
  'um evento novo não está processado'
);
select public.stripe_record_event('segredo-de-teste-com-mais-de-32-caracteres', 'evt_Teste1', 'payment_intent.succeeded');
select public.stripe_record_event('segredo-de-teste-com-mais-de-32-caracteres', 'evt_Teste1', 'payment_intent.succeeded');
select is(
  public.stripe_event_processed('segredo-de-teste-com-mais-de-32-caracteres', 'evt_Teste1'),
  true,
  'depois de registado (mesmo duas vezes) fica processado'
);

select * from finish();
rollback;

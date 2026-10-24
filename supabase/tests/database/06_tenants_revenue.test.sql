-- Inquilinos, pagamentos e receitas (Fase 7).
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(29);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('a7777777-7777-7777-7777-777777777777', 'gestor7@example.com', 'authenticated', 'authenticated', '{"full_name":"Gestor"}'),
  ('a8888888-8888-8888-8888-888888888888', 'staff7@example.com', 'authenticated', 'authenticated', '{"full_name":"Staff"}'),
  ('a9999999-9999-9999-9999-999999999999', 'outro7@example.com', 'authenticated', 'authenticated', '{"full_name":"Outro"}'),
  ('aaaaaaaa-1111-1111-1111-111111111111', 'hospede@example.com', 'authenticated', 'authenticated', '{"full_name":"Hóspede"}'),
  ('aaaaaaaa-2222-2222-2222-222222222222', 'intruso@example.com', 'authenticated', 'authenticated', '{"full_name":"Intruso"}');

create temp table ctx (key text primary key, val uuid not null);
grant all on ctx to authenticated;
create function pg_temp.ctx(p_key text) returns uuid language sql stable as
  $$ select val from ctx where key = p_key $$;
create function pg_temp.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

select pg_temp.login('a9999999-9999-9999-9999-999999999999');
insert into ctx values ('other', public.create_business('Empresa H'));

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
insert into ctx values ('b', public.create_business('Empresa G'));
reset role;
insert into public.memberships (business_id, user_id, role)
values (pg_temp.ctx('b'), 'a8888888-8888-8888-8888-888888888888', 'staff');
select pg_temp.login('a7777777-7777-7777-7777-777777777777');

insert into public.properties (id, business_id, name, address_line, postal_code, city, access_instructions) values
  ('f0000000-0000-0000-0000-000000000001', pg_temp.ctx('b'), 'Casa 1', 'Rua 1', '1000-001', 'Lisboa', 'Código 1234'),
  ('f0000000-0000-0000-0000-000000000002', pg_temp.ctx('b'), 'Casa 2', 'Rua 2', '1000-002', 'Lisboa', null);

-- Estadias ------------------------------------------------------------------

insert into public.stays (id, business_id, property_id, guest_name, guest_email, starts_on, ends_on, tenant_user_id)
values ('f0000000-0000-0000-0000-000000000011', pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000001',
        'Hóspede', 'hospede@example.com', current_date, current_date + 5, 'aaaaaaaa-2222-2222-2222-222222222222');
insert into public.stays (id, business_id, property_id, guest_name, guest_email, starts_on)
values ('f0000000-0000-0000-0000-000000000012', pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000002',
        'Outro hóspede', 'outro.hospede@example.com', current_date + 30);

select is(
  (select tenant_user_id from public.stays where id = 'f0000000-0000-0000-0000-000000000011'),
  null,
  'o gestor não consegue ligar uma conta à estadia diretamente'
);
select throws_ok(
  $$update public.stays set tenant_user_id = 'aaaaaaaa-2222-2222-2222-222222222222'
    where id = 'f0000000-0000-0000-0000-000000000011'$$,
  '42501', 'stay_link_protected',
  'nem ao editar a estadia'
);
select throws_ok(
  $$insert into public.stays (business_id, property_id, guest_name, guest_email, starts_on, ends_on)
    values (pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000001', 'X', 'x@example.com', current_date, current_date - 1)$$,
  '23514', null,
  'a saída não pode ser antes da entrada'
);

insert into ctx select 'token', invite_token from public.stays where id = 'f0000000-0000-0000-0000-000000000011';

-- Pagamentos ---------------------------------------------------------------

insert into public.payments (id, business_id, property_id, stay_id, description, amount_cents, due_on) values
  ('f0000000-0000-0000-0000-000000000021', pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000011', 'Renda', 50000, current_date);
insert into public.payments (id, business_id, property_id, description, amount_cents, due_on, status, paid_on, method) values
  ('f0000000-0000-0000-0000-000000000022', pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000002',
   'Reserva plataforma', 30000, '2026-09-15', 'paid', '2026-09-20', 'platform');
insert into public.expenses (business_id, property_id, description, category, amount_cents, incurred_on) values
  (pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000002', 'Limpeza', 'cleaning', 5000, '2026-09-21');

select throws_ok(
  $$insert into public.payments (business_id, property_id, stay_id, description, amount_cents, due_on)
    values (pg_temp.ctx('b'), 'f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000011',
            'Errado', 100, current_date)$$,
  'P0001', 'payment_property_mismatch',
  'o pagamento de uma estadia tem de ser da propriedade da estadia'
);
select throws_ok(
  $$update public.payments set tenant_reported_at = now() where id = 'f0000000-0000-0000-0000-000000000021'$$,
  '42501', 'payment_report_protected',
  'só o inquilino marca "já paguei"'
);
select ok(
  (select paid_on is not null from public.payments where id = 'f0000000-0000-0000-0000-000000000022'),
  'um pagamento recebido tem data de recebimento'
);

select results_eq(
  $$select month, property_id, revenue_cents, expense_cents
    from public.revenue_report(pg_temp.ctx('b'), '2026-09-01', '2026-09-30')$$,
  $$values ('2026-09-01'::date, 'f0000000-0000-0000-0000-000000000002'::uuid, 30000::bigint, 5000::bigint)$$,
  'o relatório soma receitas recebidas e despesas por mês e propriedade'
);
select throws_ok(
  $$select * from public.revenue_report(pg_temp.ctx('b'), '2026-09-30', '2026-09-01')$$,
  '22023', 'invalid_range',
  'o relatório recusa intervalos invertidos'
);

-- Colaborador e outra empresa não veem estadias nem pagamentos -------------

select pg_temp.login('a8888888-8888-8888-8888-888888888888');
select is((select count(*) from public.stays), 0::bigint, 'o colaborador não vê estadias');
select is((select count(*) from public.payments), 0::bigint, 'o colaborador não vê pagamentos');
select is(
  (select count(*) from public.revenue_report(pg_temp.ctx('b'), '2026-01-01', '2026-12-31')),
  0::bigint,
  'nem o relatório de receitas'
);

select pg_temp.login('a9999999-9999-9999-9999-999999999999');
select is((select count(*) from public.stays), 0::bigint, 'outra empresa não vê estadias');
select is((select count(*) from public.payments), 0::bigint, 'outra empresa não vê pagamentos');
select throws_ok(
  format($$insert into public.payments (business_id, property_id, description, amount_cents, due_on)
           values (%L, 'f0000000-0000-0000-0000-000000000001', 'Intrusão', 100, current_date)$$, pg_temp.ctx('b')),
  '42501', null,
  'outra empresa não regista pagamentos'
);

-- Convite do inquilino -----------------------------------------------------

select pg_temp.login('aaaaaaaa-2222-2222-2222-222222222222');
select throws_ok(
  format('select public.accept_stay_invitation(%L)', pg_temp.ctx('token')),
  'P0001', 'invitation_email_mismatch',
  'só o email convidado aceita o convite da estadia'
);
select is((select count(*) from public.my_stays()), 0::bigint, 'quem não é inquilino não vê estadias');

select pg_temp.login('aaaaaaaa-1111-1111-1111-111111111111');
select is(
  (select status from public.get_stay_invitation(pg_temp.ctx('token'))),
  'pending',
  'o inquilino vê o convite pendente'
);
select is(
  public.accept_stay_invitation(pg_temp.ctx('token')),
  'f0000000-0000-0000-0000-000000000011'::uuid,
  'o inquilino aceita o convite'
);

-- Portal do inquilino ------------------------------------------------------

select is((select count(*) from public.my_stays()), 1::bigint, 'o inquilino vê apenas a sua estadia');
select is(
  (select access_instructions from public.my_stays()),
  'Código 1234',
  'durante a estadia vê as instruções de acesso'
);
select is((select count(*) from public.stays), 0::bigint, 'o inquilino não lê a tabela de estadias');
select is((select count(*) from public.payments), 0::bigint, 'nem a de pagamentos');
select is((select count(*) from public.maintenance_issues), 0::bigint, 'nem a de manutenção');
select is((select count(*) from public.properties), 0::bigint, 'nem as propriedades da empresa');
select is((select count(*) from public.my_stay_payments()), 1::bigint, 'vê os pagamentos da sua estadia');

select lives_ok(
  $$select public.report_stay_payment('f0000000-0000-0000-0000-000000000021', 'Transferência 123')$$,
  'informa que pagou'
);
select throws_ok(
  $$select public.report_stay_payment('f0000000-0000-0000-0000-000000000022', 'x')$$,
  'P0001', 'payment_not_found',
  'não mexe em pagamentos que não são da sua estadia'
);

insert into ctx values ('issue', public.report_stay_issue(
  'f0000000-0000-0000-0000-000000000011', 'Esquentador avariado', 'Sem água quente', 'appliances'));
select throws_ok(
  $$select public.report_stay_issue('f0000000-0000-0000-0000-000000000012', 'Intrusão', null, 'other')$$,
  'P0001', 'stay_not_found',
  'não reporta problemas noutras estadias'
);

-- O problema chega à Manutenção da empresa --------------------------------

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select results_eq(
  format($$select property_id, stay_id, status from public.maintenance_issues where id = %L$$, pg_temp.ctx('issue')),
  $$values ('f0000000-0000-0000-0000-000000000001'::uuid, 'f0000000-0000-0000-0000-000000000011'::uuid, 'open'::text)$$,
  'o problema do inquilino aparece na Manutenção, ligado à estadia e à propriedade'
);

select * from finish();
rollback;

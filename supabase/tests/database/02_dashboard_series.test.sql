-- Testes das séries do dashboard: contagens no fuso da empresa e RLS.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into auth.users (id, email, aud, role) values
  ('44444444-4444-4444-4444-444444444444', 'dash.a@example.com', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'dash.b@example.com', 'authenticated', 'authenticated');

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

select pg_temp.login('44444444-4444-4444-4444-444444444444');
insert into ctx values ('business_a', public.create_business('Dashboard A'));
insert into public.properties (id, business_id, name, address_line, postal_code, city)
values ('cccccccc-0000-0000-0000-000000000001', pg_temp.ctx('business_a'), 'Casa', 'Rua 1', '1000-001', 'Lisboa');

-- 23:30 UTC de 14/07 já é dia 15/07 em Lisboa (UTC+1).
insert into public.tasks (business_id, property_id, type, title, scheduled_at) values
  (pg_temp.ctx('business_a'), 'cccccccc-0000-0000-0000-000000000001', 'other', 'A', '2026-07-14 23:30:00+00'),
  (pg_temp.ctx('business_a'), 'cccccccc-0000-0000-0000-000000000001', 'other', 'B', '2026-07-15 10:00:00+00'),
  (pg_temp.ctx('business_a'), 'cccccccc-0000-0000-0000-000000000001', 'other', 'C', '2026-07-16 10:00:00+00');

insert into public.expenses (business_id, description, category, amount_cents, incurred_on) values
  (pg_temp.ctx('business_a'), 'Lavandaria', 'laundry', 1500, '2026-07-15'),
  (pg_temp.ctx('business_a'), 'Detergente', 'supplies', 250, '2026-07-15');

select is(
  (select scheduled from public.dashboard_task_series(pg_temp.ctx('business_a'), '2026-07-15', '2026-07-16', 'Europe/Lisbon')
   where day = '2026-07-15'),
  2,
  'as tarefas são agrupadas pelo dia no fuso da empresa'
);

select is(
  (select count(*)::int from public.dashboard_task_series(pg_temp.ctx('business_a'), '2026-07-01', '2026-07-31')),
  31,
  'a série inclui todos os dias do período, mesmo sem dados'
);

select is(
  (select amount_cents from public.dashboard_expense_series(pg_temp.ctx('business_a'), '2026-07-15', '2026-07-15')),
  1750::bigint,
  'as despesas são somadas por dia'
);

select throws_ok(
  format($$select * from public.dashboard_task_series(%L, '2026-07-10', '2026-07-01')$$, pg_temp.ctx('business_a')),
  '22023',
  null,
  'um período inválido é recusado'
);

-- Outra empresa não vê nada através das séries.
select pg_temp.login('55555555-5555-5555-5555-555555555555');
select is(
  (select sum(scheduled)::int from public.dashboard_task_series(pg_temp.ctx('business_a'), '2026-07-01', '2026-07-31')),
  0,
  'outra empresa recebe zero tarefas'
);
select is(
  (select sum(amount_cents)::int from public.dashboard_expense_series(pg_temp.ctx('business_a'), '2026-07-01', '2026-07-31')),
  0,
  'outra empresa recebe zero despesas'
);

select * from finish();
rollback;

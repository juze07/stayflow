-- Despesas, relatório e anexos (Fase 5).
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(18);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('77777777-7777-7777-7777-777777777777', 'gestor5@example.com', 'authenticated', 'authenticated', '{"full_name":"Gestor"}'),
  ('88888888-8888-8888-8888-888888888888', 'staff5@example.com', 'authenticated', 'authenticated', '{"full_name":"Staff"}'),
  ('99999999-9999-9999-9999-999999999999', 'outro5@example.com', 'authenticated', 'authenticated', '{"full_name":"Outro"}');

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
-- Simula um ficheiro enviado para o Storage pelo utilizador indicado.
create function pg_temp.upload(p_name text, p_owner uuid) returns void language plpgsql as $$
begin
  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values ('attachments', p_name, p_owner::text, '{"size": 2048, "mimetype": "image/jpeg"}'::jsonb);
end;
$$;

select pg_temp.login('99999999-9999-9999-9999-999999999999');
insert into ctx values ('other', public.create_business('Empresa F'));

select pg_temp.login('77777777-7777-7777-7777-777777777777');
insert into ctx values ('b', public.create_business('Empresa E'));
reset role;
insert into public.memberships (business_id, user_id, role)
values (pg_temp.ctx('b'), '88888888-8888-8888-8888-888888888888', 'staff');
select pg_temp.login('77777777-7777-7777-7777-777777777777');

insert into public.properties (id, business_id, name, address_line, postal_code, city) values
  ('eeeeeeee-0000-0000-0000-000000000001', pg_temp.ctx('b'), 'Casa 1', 'Rua 1', '1000-001', 'Lisboa'),
  ('eeeeeeee-0000-0000-0000-000000000002', pg_temp.ctx('b'), 'Casa 2', 'Rua 2', '1000-002', 'Lisboa');

insert into public.maintenance_issues (id, business_id, property_id, title, reported_by) values
  ('eeeeeeee-0000-0000-0000-000000000021', pg_temp.ctx('b'), 'eeeeeeee-0000-0000-0000-000000000001',
   'Torneira', '77777777-7777-7777-7777-777777777777');

insert into public.tasks (id, business_id, property_id, type, title, scheduled_at, assignee_id) values
  ('eeeeeeee-0000-0000-0000-000000000011', pg_temp.ctx('b'), 'eeeeeeee-0000-0000-0000-000000000001',
   'cleaning', 'Limpeza atribuída', now(), '88888888-8888-8888-8888-888888888888'),
  ('eeeeeeee-0000-0000-0000-000000000012', pg_temp.ctx('b'), 'eeeeeeee-0000-0000-0000-000000000001',
   'cleaning', 'Limpeza de outra pessoa', now(), null);

-- Despesas -----------------------------------------------------------------

insert into public.expenses (id, business_id, property_id, description, category, amount_cents, incurred_on) values
  ('eeeeeeee-0000-0000-0000-000000000031', pg_temp.ctx('b'), 'eeeeeeee-0000-0000-0000-000000000001',
   'Detergentes', 'supplies', 1250, '2026-09-10'),
  ('eeeeeeee-0000-0000-0000-000000000032', pg_temp.ctx('b'), 'eeeeeeee-0000-0000-0000-000000000002',
   'Lavandaria', 'laundry', 3000, '2026-10-02'),
  ('eeeeeeee-0000-0000-0000-000000000033', pg_temp.ctx('b'), null, 'Material geral', 'other', 500, '2026-10-05');

select lives_ok(
  format($$insert into public.expenses (id, business_id, maintenance_issue_id, description, category, amount_cents, incurred_on)
           values ('eeeeeeee-0000-0000-0000-000000000034', %L, 'eeeeeeee-0000-0000-0000-000000000021',
                   'Canalizador', 'maintenance', 8000, '2026-10-06')$$, pg_temp.ctx('b')),
  'o gestor regista a despesa de um problema'
);
select is(
  (select property_id from public.expenses where id = 'eeeeeeee-0000-0000-0000-000000000034'),
  'eeeeeeee-0000-0000-0000-000000000001'::uuid,
  'a despesa de um problema fica na propriedade do problema'
);
select throws_ok(
  format($$insert into public.expenses (business_id, property_id, maintenance_issue_id, description, category, amount_cents, incurred_on)
           values (%L, 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000021',
                   'Errada', 'maintenance', 100, '2026-10-06')$$, pg_temp.ctx('b')),
  'P0001', 'expense_property_mismatch',
  'a despesa de um problema não pode ir para outra propriedade'
);

select is(
  (select sum(total_cents)::int from public.expense_report(pg_temp.ctx('b'), '2026-10-01', '2026-10-31')),
  11500,
  'o relatório soma as despesas do período'
);
select is(
  (select total_cents::int from public.expense_report(pg_temp.ctx('b'), '2026-01-01', '2026-12-31')
   where month = '2026-09-01' and property_id = 'eeeeeeee-0000-0000-0000-000000000001' and category = 'supplies'),
  1250,
  'o relatório agrupa por mês, propriedade e categoria'
);
select throws_ok(
  format($$select * from public.expense_report(%L, '2026-10-31', '2026-10-01')$$, pg_temp.ctx('b')),
  '22023', 'invalid_range',
  'o relatório recusa intervalos invertidos'
);

select pg_temp.login('88888888-8888-8888-8888-888888888888');
select is((select count(*)::int from public.expenses), 0, 'o colaborador não vê despesas');
select is(
  (select count(*)::int from public.expense_report(pg_temp.ctx('b'), '2026-01-01', '2026-12-31')),
  0,
  'o relatório não mostra nada a um colaborador'
);
select throws_ok(
  format($$insert into public.expenses (business_id, description, category, amount_cents, incurred_on)
           values (%L, 'Tentativa', 'other', 100, '2026-10-06')$$, pg_temp.ctx('b')),
  '42501', null,
  'o colaborador não regista despesas'
);

select pg_temp.login('99999999-9999-9999-9999-999999999999');
select is(
  (select count(*)::int from public.expense_report(pg_temp.ctx('b'), '2026-01-01', '2026-12-31')),
  0,
  'outra empresa não vê o relatório'
);

-- Anexos -------------------------------------------------------------------

reset role;
select pg_temp.upload(pg_temp.ctx('b') || '/tasks/eeeeeeee-0000-0000-0000-000000000011/a.jpg', '88888888-8888-8888-8888-888888888888');
select pg_temp.upload(pg_temp.ctx('b') || '/tasks/eeeeeeee-0000-0000-0000-000000000012/b.jpg', '88888888-8888-8888-8888-888888888888');
select pg_temp.upload(pg_temp.ctx('b') || '/expenses/eeeeeeee-0000-0000-0000-000000000011/c.jpg', '88888888-8888-8888-8888-888888888888');
select pg_temp.upload(pg_temp.ctx('b') || '/expenses/eeeeeeee-0000-0000-0000-000000000031/r.jpg', '77777777-7777-7777-7777-777777777777');

select pg_temp.login('88888888-8888-8888-8888-888888888888');
select lives_ok(
  format($$insert into public.attachments (business_id, storage_path, mime_type, size_bytes, task_id)
           values (%L, %L, 'image/png', 1, 'eeeeeeee-0000-0000-0000-000000000011')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/tasks/eeeeeeee-0000-0000-0000-000000000011/a.jpg'),
  'o colaborador anexa uma fotografia à sua limpeza'
);
select is(
  (select size_bytes || ' ' || mime_type from public.attachments where task_id = 'eeeeeeee-0000-0000-0000-000000000011'),
  '2048 image/jpeg',
  'tamanho e tipo vêm do Storage, não do cliente'
);
select throws_ok(
  format($$insert into public.attachments (business_id, storage_path, mime_type, size_bytes, task_id)
           values (%L, %L, 'image/jpeg', 1, 'eeeeeeee-0000-0000-0000-000000000012')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/tasks/eeeeeeee-0000-0000-0000-000000000012/b.jpg'),
  '42501', 'attachment_not_allowed',
  'o colaborador não anexa a tarefas de outras pessoas'
);
select throws_ok(
  format($$insert into public.attachments (business_id, storage_path, mime_type, size_bytes, task_id)
           values (%L, %L, 'image/jpeg', 1, 'eeeeeeee-0000-0000-0000-000000000011')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/expenses/eeeeeeee-0000-0000-0000-000000000011/c.jpg'),
  'P0001', 'attachment_path_mismatch',
  'o caminho tem de corresponder à entidade'
);
select throws_ok(
  format($$insert into public.attachments (business_id, storage_path, mime_type, size_bytes, task_id)
           values (%L, %L, 'image/jpeg', 1, 'eeeeeeee-0000-0000-0000-000000000011')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/tasks/eeeeeeee-0000-0000-0000-000000000011/nao-existe.jpg'),
  'P0001', 'attachment_file_missing',
  'não se regista um anexo sem ficheiro enviado'
);
select throws_ok(
  format($$insert into public.attachments (business_id, storage_path, kind, mime_type, size_bytes, expense_id)
           values (%L, %L, 'receipt', 'image/jpeg', 1, 'eeeeeeee-0000-0000-0000-000000000031')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/expenses/eeeeeeee-0000-0000-0000-000000000031/r.jpg'),
  '42501', null,
  'o colaborador não anexa comprovativos de despesas'
);

select pg_temp.login('77777777-7777-7777-7777-777777777777');
select lives_ok(
  format($$insert into public.attachments (business_id, storage_path, kind, mime_type, size_bytes, expense_id)
           values (%L, %L, 'receipt', 'image/jpeg', 1, 'eeeeeeee-0000-0000-0000-000000000031')$$,
         pg_temp.ctx('b'), pg_temp.ctx('b') || '/expenses/eeeeeeee-0000-0000-0000-000000000031/r.jpg'),
  'o gestor anexa o comprovativo da despesa'
);

select pg_temp.login('99999999-9999-9999-9999-999999999999');
select is((select count(*)::int from public.attachments), 0, 'outra empresa não vê os anexos');

select * from finish();
rollback;

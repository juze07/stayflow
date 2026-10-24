-- Listas de verificação, inspeções e manutenção (Fase 4).
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('55555555-5555-5555-5555-555555555555', 'gestor4@example.com', 'authenticated', 'authenticated', '{"full_name":"Gestor"}'),
  ('66666666-6666-6666-6666-666666666666', 'staff4@example.com', 'authenticated', 'authenticated', '{"full_name":"Staff"}');

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
create function pg_temp.affected(p_sql text) returns integer language plpgsql as $$
declare v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select pg_temp.login('55555555-5555-5555-5555-555555555555');
insert into ctx values ('b', public.create_business('Empresa D'));
insert into ctx select 'cleaning_tpl', id from public.checklist_templates where business_id = pg_temp.ctx('b') and kind = 'cleaning';
insert into ctx select 'inspection_tpl', id from public.checklist_templates where business_id = pg_temp.ctx('b') and kind = 'inspection';
-- A entrada na equipa normalmente vem de um convite; aqui é inserida diretamente.
reset role;
insert into public.memberships (business_id, user_id, role)
values (pg_temp.ctx('b'), '66666666-6666-6666-6666-666666666666', 'staff');
select pg_temp.login('55555555-5555-5555-5555-555555555555');

insert into public.properties (id, business_id, name, address_line, postal_code, city) values
  ('dddddddd-0000-0000-0000-000000000001', pg_temp.ctx('b'), 'Casa 1', 'Rua 1', '1000-001', 'Lisboa'),
  ('dddddddd-0000-0000-0000-000000000002', pg_temp.ctx('b'), 'Casa 2', 'Rua 2', '1000-002', 'Lisboa');

-- Limpeza com modelo: a lista é copiada.
insert into public.tasks (id, business_id, property_id, type, title, scheduled_at, assignee_id, checklist_template_id)
values ('dddddddd-0000-0000-0000-000000000011', pg_temp.ctx('b'), 'dddddddd-0000-0000-0000-000000000001',
        'cleaning', 'Limpeza', now(), '66666666-6666-6666-6666-666666666666', pg_temp.ctx('cleaning_tpl'));

select is(
  (select count(*)::int from public.task_checklist_items where task_id = 'dddddddd-0000-0000-0000-000000000011'),
  (select count(*)::int from public.checklist_template_items where template_id = pg_temp.ctx('cleaning_tpl')),
  'criar uma limpeza copia os itens do modelo'
);

select throws_ok(
  format($$insert into public.tasks (business_id, property_id, type, title, scheduled_at, checklist_template_id)
           values (%L, 'dddddddd-0000-0000-0000-000000000001', 'cleaning', 'Errada', now(), %L)$$,
         pg_temp.ctx('b'), pg_temp.ctx('inspection_tpl')),
  'P0001', 'checklist_kind_mismatch',
  'uma limpeza não usa um modelo de inspeção'
);

select throws_ok(
  $$update public.tasks set type = 'other' where id = 'dddddddd-0000-0000-0000-000000000011'$$,
  'P0001', 'task_type_locked',
  'o tipo de uma limpeza não muda depois de criada'
);

-- Alterar o modelo não mexe nas tarefas já criadas.
select lives_ok(
  format($$select public.save_checklist_template(%L, %L, 'cleaning', 'Limpeza rápida',
           '[{"label":"Só a cozinha","required":true},{"label":"Opcional","required":false}]'::jsonb)$$,
         pg_temp.ctx('b'), pg_temp.ctx('cleaning_tpl')),
  'o gestor guarda o modelo com os novos itens'
);
select is(
  (select count(*)::int from public.checklist_template_items where template_id = pg_temp.ctx('cleaning_tpl')),
  2,
  'os itens do modelo são substituídos'
);
select ok(
  (select count(*) > 2 from public.task_checklist_items where task_id = 'dddddddd-0000-0000-0000-000000000011'),
  'a lista da limpeza existente mantém-se'
);

-- Inspeção: o registo é criado com a tarefa.
insert into public.tasks (id, business_id, property_id, type, title, scheduled_at, assignee_id)
values ('dddddddd-0000-0000-0000-000000000012', pg_temp.ctx('b'), 'dddddddd-0000-0000-0000-000000000001',
        'inspection', 'Inspeção', now(), '66666666-6666-6666-6666-666666666666');
insert into ctx select 'inspection', id from public.inspections where task_id = 'dddddddd-0000-0000-0000-000000000012';
select is((select count(*)::int from ctx where key = 'inspection'), 1, 'criar uma inspeção cria o registo do resultado');

-- Colaborador responsável.
select pg_temp.login('66666666-6666-6666-6666-666666666666');

select throws_ok(
  $$select public.save_checklist_template((select val from ctx where key = 'b'), null, 'cleaning', 'Minha', '[{"label":"x"}]'::jsonb)$$,
  '42501', null,
  'o colaborador não cria modelos'
);

select throws_ok(
  $$update public.tasks set status = 'completed' where id = 'dddddddd-0000-0000-0000-000000000012'$$,
  'P0001', 'inspection_result_required',
  'a inspeção não fica concluída sem resultado'
);

select throws_ok(
  $$update public.inspections set result = 'failed' where task_id = 'dddddddd-0000-0000-0000-000000000012'$$,
  'P0001', 'inspection_observations_required',
  'uma inspeção reprovada exige observações'
);

update public.inspections set result = 'failed', observations = 'Torneira a pingar'
where task_id = 'dddddddd-0000-0000-0000-000000000012';
select lives_ok(
  $$update public.tasks set status = 'completed' where id = 'dddddddd-0000-0000-0000-000000000012'$$,
  'com resultado registado, o inspetor conclui a inspeção'
);

select throws_ok(
  $$update public.inspections set result = 'approved' where task_id = 'dddddddd-0000-0000-0000-000000000012'$$,
  'P0001', 'task_closed',
  'o resultado fica fechado depois de concluída'
);

-- O colaborador reporta um problema a partir da inspeção.
select lives_ok(
  format($$insert into public.maintenance_issues (business_id, property_id, title, source_inspection_id, reported_by)
           values (%L, 'dddddddd-0000-0000-0000-000000000001', 'Torneira', %L, '66666666-6666-6666-6666-666666666666')$$,
         pg_temp.ctx('b'), pg_temp.ctx('inspection')),
  'o colaborador reporta um problema ligado à inspeção'
);

select throws_ok(
  format($$insert into public.maintenance_issues (business_id, property_id, title, source_inspection_id, reported_by)
           values (%L, 'dddddddd-0000-0000-0000-000000000002', 'Noutra casa', %L, '66666666-6666-6666-6666-666666666666')$$,
         pg_temp.ctx('b'), pg_temp.ctx('inspection')),
  'P0001', 'inspection_property_mismatch',
  'o problema tem de ser da mesma propriedade da inspeção'
);

select is(
  pg_temp.affected($$update public.maintenance_issues set title = 'Alterado' where title = 'Torneira'$$),
  0,
  'o colaborador não edita problemas que não lhe estão atribuídos'
);

-- Gestor: tarefa de manutenção ligada ao problema.
select pg_temp.login('55555555-5555-5555-5555-555555555555');
insert into ctx select 'issue', id from public.maintenance_issues where title = 'Torneira';

select throws_ok(
  format($$insert into public.tasks (business_id, property_id, type, title, scheduled_at, maintenance_issue_id)
           values (%L, 'dddddddd-0000-0000-0000-000000000002', 'maintenance', 'Reparar', now(), %L)$$,
         pg_temp.ctx('b'), pg_temp.ctx('issue')),
  'P0001', 'maintenance_issue_property_mismatch',
  'a tarefa de manutenção tem de ser da propriedade do problema'
);

select lives_ok(
  format($$insert into public.tasks (business_id, property_id, type, title, scheduled_at, maintenance_issue_id)
           values (%L, 'dddddddd-0000-0000-0000-000000000001', 'maintenance', 'Reparar', now(), %L)$$,
         pg_temp.ctx('b'), pg_temp.ctx('issue')),
  'o gestor agenda a reparação na propriedade certa'
);

select * from finish();
rollback;

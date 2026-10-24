-- Testes de isolamento multiempresa e permissões por função.
-- Executar com: npm run test:db  (equivale a `supabase test db`)
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(34);

-- -----------------------------------------------------------------------------
-- Preparação: três utilizadores e um contexto partilhado entre papéis.
-- -----------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'admin.a@example.com', 'authenticated', 'authenticated', '{"full_name":"Admin A"}'),
  ('22222222-2222-2222-2222-222222222222', 'staff.a@example.com', 'authenticated', 'authenticated', '{"full_name":"Staff A"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin.b@example.com', 'authenticated', 'authenticated', '{"full_name":"Admin B"}');

create temp table ctx (key text primary key, val uuid not null);
grant all on ctx to authenticated;

create function pg_temp.ctx(p_key text) returns uuid language sql stable as
  $$ select val from ctx where key = p_key $$;

-- Executa um comando e devolve o número de linhas afetadas (com RLS aplicado).
create function pg_temp.affected(p_sql text) returns integer language plpgsql as $$
declare
  v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function pg_temp.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

select is(
  (select count(*)::int from public.profiles where id in (
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')),
  3,
  'o registo cria um perfil para cada utilizador'
);

-- Empresa A
select pg_temp.login('11111111-1111-1111-1111-111111111111');
insert into ctx values ('business_a', public.create_business('Empresa A'));

select is(
  (select count(*)::int from public.checklist_templates where business_id = pg_temp.ctx('business_a')),
  2,
  'create_business cria as listas de verificação por defeito'
);

insert into public.properties (id, business_id, name, address_line, postal_code, city, bedrooms, bathrooms, max_guests)
values ('aaaaaaaa-0000-0000-0000-000000000001', pg_temp.ctx('business_a'), 'T2 Alfama', 'Rua A, 1', '1100-001', 'Lisboa', 2, 1, 4);

insert into public.invitations (business_id, email, role)
values (pg_temp.ctx('business_a'), 'staff.a@example.com', 'staff');
insert into ctx select 'invite_staff', token from public.invitations where email = 'staff.a@example.com';

insert into public.invitations (business_id, email, role)
values (pg_temp.ctx('business_a'), 'outra.pessoa@example.com', 'staff');
insert into ctx select 'invite_other', token from public.invitations where email = 'outra.pessoa@example.com';

insert into public.expenses (business_id, property_id, description, category, amount_cents, incurred_on)
values (pg_temp.ctx('business_a'), 'aaaaaaaa-0000-0000-0000-000000000001', 'Detergentes', 'supplies', 2450, current_date);

-- Colaborador aceita o convite.
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is(
  public.accept_invitation(pg_temp.ctx('invite_staff')),
  pg_temp.ctx('business_a'),
  'o colaborador aceita o convite com o email certo'
);

-- Tarefa de limpeza atribuída ao colaborador, com dois itens obrigatórios.
select pg_temp.login('11111111-1111-1111-1111-111111111111');
insert into public.tasks (id, business_id, property_id, type, title, scheduled_at, assignee_id)
values ('aaaaaaaa-0000-0000-0000-000000000011', pg_temp.ctx('business_a'), 'aaaaaaaa-0000-0000-0000-000000000001',
        'cleaning', 'Limpeza check-out', now() + interval '2 hours', '22222222-2222-2222-2222-222222222222');
insert into public.task_checklist_items (business_id, task_id, label, position) values
  (pg_temp.ctx('business_a'), 'aaaaaaaa-0000-0000-0000-000000000011', 'Limpar quartos', 0),
  (pg_temp.ctx('business_a'), 'aaaaaaaa-0000-0000-0000-000000000011', 'Limpar cozinha', 1);

insert into storage.objects (bucket_id, name, owner_id)
values ('attachments', pg_temp.ctx('business_a')::text || '/tasks/foto-a.jpg', '11111111-1111-1111-1111-111111111111');

-- Empresa B
select pg_temp.login('33333333-3333-3333-3333-333333333333');
insert into ctx values ('business_b', public.create_business('Empresa B'));
insert into public.properties (id, business_id, name, address_line, postal_code, city)
values ('bbbbbbbb-0000-0000-0000-000000000001', pg_temp.ctx('business_b'), 'Casa Porto', 'Rua B, 2', '4000-001', 'Porto');

-- -----------------------------------------------------------------------------
-- A empresa B não vê nem altera nada da empresa A.
-- -----------------------------------------------------------------------------

select is((select count(*)::int from public.businesses), 1, 'B só vê a sua empresa');
select is((select count(*)::int from public.properties where business_id = pg_temp.ctx('business_a')), 0, 'B não vê propriedades de A');
select is((select count(*)::int from public.tasks), 0, 'B não vê tarefas de A');
select is((select count(*)::int from public.task_checklist_items), 0, 'B não vê itens de checklist de A');
select is((select count(*)::int from public.expenses), 0, 'B não vê despesas de A');
select is((select count(*)::int from public.memberships where business_id = pg_temp.ctx('business_a')), 0, 'B não vê membros de A');
select is((select count(*)::int from public.invitations), 0, 'B não vê convites de A');
select is((select count(*)::int from public.checklist_templates), 2, 'B só vê as suas listas de verificação');
select is((select count(*)::int from public.activity_log where business_id = pg_temp.ctx('business_a')), 0, 'B não vê a atividade de A');
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'B não vê perfis de utilizadores de A'
);

select is(
  pg_temp.affected($$update public.properties set name = 'Alterado por B' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$),
  0,
  'B não consegue alterar propriedades de A'
);

select is(
  pg_temp.affected($$delete from public.properties where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$),
  0,
  'B não consegue apagar propriedades de A'
);

select throws_ok(
  format($$insert into public.properties (business_id, name, address_line, postal_code, city)
           values (%L, 'Intrusa', 'Rua X', '1000-001', 'Lisboa')$$, pg_temp.ctx('business_a')),
  '42501',
  null,
  'B não consegue criar propriedades na empresa A'
);

select throws_ok(
  format($$insert into public.tasks (business_id, property_id, type, title, scheduled_at)
           values (%L, 'aaaaaaaa-0000-0000-0000-000000000001', 'other', 'Cruzada', now())$$, pg_temp.ctx('business_b')),
  '23503',
  null,
  'uma tarefa de B não pode apontar para uma propriedade de A'
);

select throws_ok(
  format($$update public.properties set business_id = %L where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
         pg_temp.ctx('business_a')),
  '42501',
  null,
  'uma linha não pode mudar de empresa'
);

select throws_ok(
  format($$select public.accept_invitation(%L)$$, pg_temp.ctx('invite_other')),
  'P0001',
  'invitation_email_mismatch',
  'um convite só pode ser aceite pelo email convidado'
);

select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id)
           values ('attachments', %L, '33333333-3333-3333-3333-333333333333')$$,
         pg_temp.ctx('business_a')::text || '/tasks/intrusa.jpg'),
  '42501',
  null,
  'B não consegue enviar ficheiros para a pasta de A'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'attachments'),
  0,
  'B não vê ficheiros de A'
);

-- -----------------------------------------------------------------------------
-- Colaborador (staff) da empresa A
-- -----------------------------------------------------------------------------

select pg_temp.login('22222222-2222-2222-2222-222222222222');

select is((select count(*)::int from public.properties), 1, 'o colaborador vê as propriedades da sua empresa');
select is((select count(*)::int from public.expenses), 0, 'o colaborador não vê despesas');

select throws_ok(
  format($$insert into public.properties (business_id, name, address_line, postal_code, city)
           values (%L, 'Nova', 'Rua Y', '1000-002', 'Lisboa')$$, pg_temp.ctx('business_a')),
  '42501',
  null,
  'o colaborador não cria propriedades'
);

select throws_ok(
  $$update public.tasks set title = 'Outro título' where id = 'aaaaaaaa-0000-0000-0000-000000000011'$$,
  '42501',
  'staff can only change status and notes',
  'o colaborador não altera o título da tarefa'
);

update public.tasks set status = 'in_progress' where id = 'aaaaaaaa-0000-0000-0000-000000000011';
select isnt(
  (select started_at from public.tasks where id = 'aaaaaaaa-0000-0000-0000-000000000011'),
  null,
  'iniciar a tarefa regista a hora de início'
);

select throws_ok(
  $$update public.tasks set status = 'completed' where id = 'aaaaaaaa-0000-0000-0000-000000000011'$$,
  'P0001',
  'checklist_incomplete',
  'uma limpeza não fica concluída com itens por marcar'
);

update public.task_checklist_items set is_checked = true where task_id = 'aaaaaaaa-0000-0000-0000-000000000011';
select is(
  (select count(*)::int from public.task_checklist_items
   where task_id = 'aaaaaaaa-0000-0000-0000-000000000011'
     and checked_by = '22222222-2222-2222-2222-222222222222' and checked_at is not null),
  2,
  'marcar itens regista quem e quando'
);

update public.tasks set status = 'completed' where id = 'aaaaaaaa-0000-0000-0000-000000000011';
select is(
  (select completed_by from public.tasks where id = 'aaaaaaaa-0000-0000-0000-000000000011'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'a conclusão regista o utilizador responsável'
);

select is(
  pg_temp.affected($$update public.memberships set role = 'admin' where user_id = '22222222-2222-2222-2222-222222222222'$$),
  0,
  'o colaborador não se promove a administrador'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'attachments'),
  1,
  'o colaborador vê os ficheiros da sua empresa'
);

-- -----------------------------------------------------------------------------
-- Administrador e papel anónimo
-- -----------------------------------------------------------------------------

select pg_temp.login('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$update public.memberships set role = 'staff' where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'P0001',
  'business must keep at least one active admin',
  'a empresa nunca fica sem administrador'
);

select ok(
  (select count(*) > 0 from public.activity_log where business_id = pg_temp.ctx('business_a') and entity_type = 'task'),
  'as alterações de tarefas aparecem na atividade recente'
);

reset role;
set local role anon;
select throws_ok(
  $$select count(*) from public.properties$$,
  '42501',
  null,
  'o papel anónimo não tem acesso às tabelas'
);

select * from finish();
rollback;

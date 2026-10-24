-- Propriedades arquivadas não recebem tarefas novas.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(3);

insert into auth.users (id, email, aud, role) values
  ('44444444-4444-4444-4444-444444444444', 'gestor@example.com', 'authenticated', 'authenticated');

create temp table ctx (key text primary key, val uuid not null);
grant all on ctx to authenticated;

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
set local role authenticated;

insert into ctx values ('business', public.create_business('Empresa C'));
insert into public.properties (id, business_id, name, address_line, postal_code, city)
values ('cccccccc-0000-0000-0000-000000000001', (select val from ctx where key = 'business'),
        'Casa arquivada', 'Rua C, 3', '8000-001', 'Faro');

insert into public.tasks (business_id, property_id, type, title, scheduled_at)
values ((select val from ctx where key = 'business'), 'cccccccc-0000-0000-0000-000000000001',
        'cleaning', 'Antes de arquivar', now());

update public.properties set archived_at = now() where id = 'cccccccc-0000-0000-0000-000000000001';

select throws_ok(
  $$insert into public.tasks (business_id, property_id, type, title, scheduled_at)
    select val, 'cccccccc-0000-0000-0000-000000000001', 'cleaning', 'Depois de arquivar', now()
    from ctx where key = 'business'$$,
  'P0001',
  'property_archived',
  'não é possível criar tarefas numa propriedade arquivada'
);

select lives_ok(
  $$update public.tasks set status = 'completed' where title = 'Antes de arquivar'$$,
  'as tarefas existentes continuam a poder ser atualizadas'
);

select is(
  (select count(*)::int from public.activity_log where entity_type = 'property' and action = 'archived'),
  1,
  'o arquivo fica registado na atividade'
);

select * from finish();
rollback;

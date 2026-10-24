-- =============================================================================
-- StayFlow: registo de atividade e armazenamento de ficheiros
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Registo de atividade ("Atividade recente" no dashboard)
-- Escrito apenas por triggers; os utilizadores só leem.
-- -----------------------------------------------------------------------------

create table public.activity_log (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null check (
    entity_type in ('property', 'task', 'inspection', 'maintenance_issue', 'expense')
  ),
  entity_id uuid not null,
  action text not null check (action in ('created', 'status_changed', 'archived', 'restored', 'deleted')),
  summary text not null default '' check (char_length(summary) <= 200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_business_created_idx on public.activity_log (business_id, created_at desc);

create or replace function private.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  v_entity text := tg_argv[0];
  v_action text;
  v_metadata jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
  elsif tg_op = 'DELETE' then
    -- Quando a própria empresa está a ser apagada, não há nada a registar.
    if not exists (select 1 from public.businesses b where b.id = (v_row ->> 'business_id')::uuid) then
      return null;
    end if;
    v_action := 'deleted';
  elsif v_row ? 'archived_at' and (v_row ->> 'archived_at') is distinct from (v_old ->> 'archived_at') then
    v_action := case when v_row ->> 'archived_at' is null then 'restored' else 'archived' end;
  elsif v_row ? 'status' and (v_row ->> 'status') is distinct from (v_old ->> 'status') then
    v_action := 'status_changed';
    v_metadata := jsonb_build_object('from', v_old ->> 'status', 'to', v_row ->> 'status');
  elsif v_row ? 'result' and (v_row ->> 'result') is distinct from (v_old ->> 'result') then
    v_action := 'status_changed';
    v_metadata := jsonb_build_object('from', v_old ->> 'result', 'to', v_row ->> 'result');
  else
    -- Edições simples não entram no registo, para não gerar ruído.
    return null;
  end if;

  insert into public.activity_log (business_id, actor_id, entity_type, entity_id, action, summary, metadata)
  values (
    (v_row ->> 'business_id')::uuid,
    auth.uid(),
    v_entity,
    (v_row ->> 'id')::uuid,
    v_action,
    left(coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'description', ''), 200),
    v_metadata
  );

  return null;
end;
$$;

create trigger properties_log_activity
  after insert or update or delete on public.properties
  for each row execute function private.log_activity('property');

create trigger tasks_log_activity
  after insert or update or delete on public.tasks
  for each row execute function private.log_activity('task');

create trigger inspections_log_activity
  after update on public.inspections
  for each row execute function private.log_activity('inspection');

create trigger maintenance_issues_log_activity
  after insert or update or delete on public.maintenance_issues
  for each row execute function private.log_activity('maintenance_issue');

create trigger expenses_log_activity
  after insert or delete on public.expenses
  for each row execute function private.log_activity('expense');

alter table public.activity_log enable row level security;

create policy activity_log_select on public.activity_log
  for select to authenticated
  using (
    business_id in (select private.user_business_ids())
    and (
      entity_type <> 'expense'
      or business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    )
  );

revoke all on public.activity_log from anon;
revoke insert, update, delete on public.activity_log from authenticated;

-- -----------------------------------------------------------------------------
-- Storage: bucket privado `attachments`
-- Caminho obrigatório: {business_id}/{entidade}/{ficheiro}
-- Ex.: 6f1c.../tasks/2b9e....jpg  ·  6f1c.../expenses/...pdf  ·  6f1c.../branding/logo.png
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Ler: membros da empresa dona da pasta (comprovativos: só gestores).
create policy attachments_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] in (select id::text from private.user_business_ids() as id)
    and (
      (storage.foldername(name))[2] is distinct from 'expenses'
      or (storage.foldername(name))[1] in (
        select id::text from private.user_business_ids_with_role(array['admin', 'manager']) as id
      )
    )
  );

-- Enviar: membros, para a pasta da própria empresa. Logótipo: só administradores.
create policy attachments_bucket_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] in (select id::text from private.user_business_ids() as id)
    and (storage.foldername(name))[2] in ('properties', 'tasks', 'inspections', 'maintenance', 'expenses', 'branding')
    and (
      (storage.foldername(name))[2] not in ('expenses', 'branding')
      or (
        (storage.foldername(name))[2] = 'expenses'
        and (storage.foldername(name))[1] in (
          select id::text from private.user_business_ids_with_role(array['admin', 'manager']) as id
        )
      )
      or (
        (storage.foldername(name))[2] = 'branding'
        and (storage.foldername(name))[1] in (
          select id::text from private.user_business_ids_with_role(array['admin']) as id
        )
      )
    )
  );

-- Apagar: gestores da empresa, ou quem enviou o ficheiro.
create policy attachments_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (
      (storage.foldername(name))[1] in (
        select id::text from private.user_business_ids_with_role(array['admin', 'manager']) as id
      )
      or (
        owner_id = (select auth.uid()::text)
        and (storage.foldername(name))[1] in (select id::text from private.user_business_ids() as id)
      )
    )
  );

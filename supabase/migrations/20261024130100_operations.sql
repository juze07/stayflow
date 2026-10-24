-- =============================================================================
-- StayFlow: operações
-- Propriedades, tarefas (incluindo limpezas e inspeções), listas de
-- verificação, manutenção, despesas e anexos.
--
-- As chaves estrangeiras compostas (business_id, x_id) garantem que uma linha
-- só pode apontar para outra linha da MESMA empresa.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Propriedades
-- -----------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  address_line text not null check (char_length(btrim(address_line)) between 1 and 200),
  postal_code text not null check (char_length(btrim(postal_code)) between 1 and 12),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  bedrooms smallint not null default 0 check (bedrooms between 0 and 100),
  bathrooms smallint not null default 0 check (bathrooms between 0 and 100),
  max_guests smallint not null default 1 check (max_guests between 1 and 500),
  access_instructions text check (char_length(access_instructions) <= 4000),
  internal_notes text check (char_length(internal_notes) <= 4000),
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create index properties_business_active_idx on public.properties (business_id, archived_at, name);

-- -----------------------------------------------------------------------------
-- Modelos de listas de verificação (limpeza e inspeção)
-- -----------------------------------------------------------------------------

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  kind text not null check (kind in ('cleaning', 'inspection')),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create index checklist_templates_business_idx on public.checklist_templates (business_id, kind);

create table public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  template_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 200),
  position integer not null default 0 check (position >= 0),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, template_id)
    references public.checklist_templates (business_id, id) on delete cascade
);

create index checklist_template_items_template_idx on public.checklist_template_items (template_id, position);

-- -----------------------------------------------------------------------------
-- Tarefas: o centro operacional. Limpezas e inspeções são tarefas.
-- -----------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  property_id uuid not null,
  type text not null check (
    type in ('cleaning', 'inspection', 'maintenance', 'preparation', 'restock', 'other')
  ),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (char_length(description) <= 4000),
  scheduled_at timestamptz not null,
  estimated_minutes integer check (estimated_minutes between 1 and 1440),
  assignee_id uuid,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  notes text check (char_length(notes) <= 4000),
  maintenance_issue_id uuid,
  checklist_template_id uuid,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  constraint tasks_completed_consistency check ((status = 'completed') = (completed_at is not null)),
  foreign key (business_id, property_id) references public.properties (business_id, id),
  -- O responsável tem de ser membro da mesma empresa.
  foreign key (business_id, assignee_id)
    references public.memberships (business_id, user_id) on delete set null (assignee_id),
  foreign key (business_id, checklist_template_id)
    references public.checklist_templates (business_id, id) on delete set null (checklist_template_id)
);

create index tasks_business_schedule_idx on public.tasks (business_id, scheduled_at);
create index tasks_business_status_idx on public.tasks (business_id, status);
create index tasks_property_idx on public.tasks (property_id, scheduled_at desc);
create index tasks_assignee_idx on public.tasks (assignee_id, scheduled_at) where assignee_id is not null;

-- Itens da lista de verificação de UMA tarefa (cópia do modelo).
create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  task_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 200),
  position integer not null default 0 check (position >= 0),
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_at timestamptz,
  checked_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_checklist_items_checked_consistency check (is_checked = (checked_at is not null)),
  foreign key (business_id, task_id) references public.tasks (business_id, id) on delete cascade
);

create index task_checklist_items_task_idx on public.task_checklist_items (task_id, position);

-- -----------------------------------------------------------------------------
-- Inspeções: resultado de uma tarefa do tipo inspeção.
-- -----------------------------------------------------------------------------

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  task_id uuid not null unique,
  result text check (result in ('approved', 'approved_with_notes', 'failed')),
  observations text check (char_length(observations) <= 4000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, task_id) references public.tasks (business_id, id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- Ocorrências de manutenção
-- -----------------------------------------------------------------------------

create table public.maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  property_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (char_length(description) <= 4000),
  category text not null default 'other' check (
    category in ('plumbing', 'electrical', 'appliances', 'furniture', 'structure', 'cleaning', 'other')
  ),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (
    status in ('open', 'investigating', 'in_progress', 'resolved', 'cancelled')
  ),
  reported_at timestamptz not null default now(),
  reported_by uuid references public.profiles (id) on delete set null default auth.uid(),
  assignee_id uuid,
  estimated_cost_cents integer check (estimated_cost_cents >= 0),
  final_cost_cents integer check (final_cost_cents >= 0),
  resolved_at timestamptz,
  source_inspection_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  constraint maintenance_issues_resolved_consistency check ((status = 'resolved') = (resolved_at is not null)),
  foreign key (business_id, property_id) references public.properties (business_id, id),
  foreign key (business_id, assignee_id)
    references public.memberships (business_id, user_id) on delete set null (assignee_id),
  foreign key (business_id, source_inspection_id)
    references public.inspections (business_id, id) on delete set null (source_inspection_id)
);

create index maintenance_issues_business_status_idx on public.maintenance_issues (business_id, status);
create index maintenance_issues_property_idx on public.maintenance_issues (property_id, reported_at desc);

alter table public.tasks
  add constraint tasks_maintenance_issue_fkey
  foreign key (business_id, maintenance_issue_id)
  references public.maintenance_issues (business_id, id) on delete set null (maintenance_issue_id);

-- -----------------------------------------------------------------------------
-- Despesas (controlo interno; não é faturação nem contabilidade)
-- -----------------------------------------------------------------------------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  property_id uuid,
  maintenance_issue_id uuid,
  description text not null check (char_length(btrim(description)) between 1 and 200),
  category text not null check (category in ('cleaning', 'maintenance', 'supplies', 'laundry', 'other')),
  amount_cents integer not null check (amount_cents > 0 and amount_cents < 100000000),
  incurred_on date not null,
  supplier text check (char_length(supplier) <= 120),
  notes text check (char_length(notes) <= 4000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, property_id) references public.properties (business_id, id),
  foreign key (business_id, maintenance_issue_id)
    references public.maintenance_issues (business_id, id) on delete set null (maintenance_issue_id)
);

create index expenses_business_date_idx on public.expenses (business_id, incurred_on desc);
create index expenses_property_idx on public.expenses (property_id, incurred_on desc) where property_id is not null;

-- -----------------------------------------------------------------------------
-- Anexos (metadados; o ficheiro vive no Storage, bucket privado `attachments`)
-- -----------------------------------------------------------------------------

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 500),
  kind text not null default 'photo' check (kind in ('photo', 'before', 'after', 'receipt', 'document')),
  file_name text check (char_length(file_name) <= 255),
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf')
  ),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  property_id uuid,
  task_id uuid,
  inspection_id uuid,
  maintenance_issue_id uuid,
  expense_id uuid,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  -- Cada anexo pertence a exatamente uma entidade.
  constraint attachments_single_parent check (
    num_nonnulls(property_id, task_id, inspection_id, maintenance_issue_id, expense_id) = 1
  ),
  -- O ficheiro tem de estar na pasta da própria empresa.
  constraint attachments_path_in_business_folder check (
    storage_path like business_id::text || '/%'
  ),
  foreign key (business_id, property_id) references public.properties (business_id, id) on delete cascade,
  foreign key (business_id, task_id) references public.tasks (business_id, id) on delete cascade,
  foreign key (business_id, inspection_id) references public.inspections (business_id, id) on delete cascade,
  foreign key (business_id, maintenance_issue_id)
    references public.maintenance_issues (business_id, id) on delete cascade,
  foreign key (business_id, expense_id) references public.expenses (business_id, id) on delete cascade
);

create index attachments_property_idx on public.attachments (property_id) where property_id is not null;
create index attachments_task_idx on public.attachments (task_id) where task_id is not null;
create index attachments_inspection_idx on public.attachments (inspection_id) where inspection_id is not null;
create index attachments_issue_idx on public.attachments (maintenance_issue_id) where maintenance_issue_id is not null;
create index attachments_expense_idx on public.attachments (expense_id) where expense_id is not null;

-- -----------------------------------------------------------------------------
-- Triggers comuns: updated_at e business_id imutável
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'checklist_templates', 'checklist_template_items', 'tasks',
    'task_checklist_items', 'inspections', 'maintenance_issues', 'expenses'
  ] loop
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s
         for each row execute function private.set_updated_at()', t);
  end loop;

  foreach t in array array[
    'properties', 'checklist_templates', 'checklist_template_items', 'tasks',
    'task_checklist_items', 'inspections', 'maintenance_issues', 'expenses', 'attachments'
  ] loop
    execute format(
      'create trigger %1$s_prevent_business_change before update on public.%1$s
         for each row execute function private.prevent_business_change()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Regras de negócio das tarefas
-- -----------------------------------------------------------------------------

create or replace function private.tasks_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_manager boolean;
  v_unchecked integer;
begin
  -- Um colaborador (staff) só pode mudar o estado e as notas das suas tarefas.
  if tg_op = 'UPDATE' and auth.uid() is not null then
    v_is_manager := private.has_role(new.business_id, array['admin', 'manager']);
    if not v_is_manager
       and (to_jsonb(new) - array['status', 'notes', 'started_at', 'completed_at', 'completed_by', 'updated_at'])
           <> (to_jsonb(old) - array['status', 'notes', 'started_at', 'completed_at', 'completed_by', 'updated_at']) then
      raise exception 'staff can only change status and notes' using errcode = '42501';
    end if;
  end if;

  -- Datas de início e conclusão são registadas pelo servidor, não pelo cliente.
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status = 'in_progress' and new.started_at is null then
      new.started_at := now();
    end if;

    if new.status = 'completed' then
      -- Uma limpeza ou inspeção só fica concluída com a lista obrigatória completa.
      if new.type in ('cleaning', 'inspection') and tg_op = 'UPDATE' then
        select count(*) into v_unchecked
        from public.task_checklist_items i
        where i.task_id = new.id and i.is_required and not i.is_checked;

        if v_unchecked > 0 then
          raise exception 'checklist_incomplete' using errcode = 'P0001';
        end if;
      end if;

      if new.type = 'inspection' and not exists (
        select 1 from public.inspections i where i.task_id = new.id and i.result is not null
      ) then
        raise exception 'inspection_result_required' using errcode = 'P0001';
      end if;

      new.completed_at := now();
      new.completed_by := auth.uid();
    else
      new.completed_at := null;
      new.completed_by := null;
    end if;
  elsif tg_op = 'UPDATE' then
    -- Sem mudança de estado: mantém os valores do servidor.
    new.started_at := old.started_at;
    new.completed_at := old.completed_at;
    new.completed_by := old.completed_by;
  end if;

  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

create or replace function private.task_checklist_items_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task_status text;
begin
  select t.status into v_task_status from public.tasks t where t.id = new.task_id;

  if v_task_status in ('completed', 'cancelled') then
    raise exception 'task_closed' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null
     and not private.has_role(new.business_id, array['admin', 'manager'])
     and (to_jsonb(new) - array['is_checked', 'checked_at', 'checked_by', 'updated_at'])
         <> (to_jsonb(old) - array['is_checked', 'checked_at', 'checked_by', 'updated_at']) then
    raise exception 'staff can only check items' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' or new.is_checked is distinct from old.is_checked then
    if new.is_checked then
      new.checked_at := now();
      new.checked_by := auth.uid();
    else
      new.checked_at := null;
      new.checked_by := null;
    end if;
  else
    new.checked_at := old.checked_at;
    new.checked_by := old.checked_by;
  end if;

  return new;
end;
$$;

create trigger task_checklist_items_before_write
  before insert or update on public.task_checklist_items
  for each row execute function private.task_checklist_items_before_write();

create or replace function private.inspections_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.tasks t where t.id = new.task_id and t.type = 'inspection'
  ) then
    raise exception 'inspection must belong to an inspection task' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger inspections_before_write
  before insert or update on public.inspections
  for each row execute function private.inspections_before_write();

create or replace function private.maintenance_issues_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O responsável (não gestor) só pode mudar o estado e o custo final.
  if tg_op = 'UPDATE' and auth.uid() is not null
     and not private.has_role(new.business_id, array['admin', 'manager'])
     and (to_jsonb(new) - array['status', 'final_cost_cents', 'resolved_at', 'updated_at'])
         <> (to_jsonb(old) - array['status', 'final_cost_cents', 'resolved_at', 'updated_at']) then
    raise exception 'only managers can edit this issue' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.resolved_at := case when new.status = 'resolved' then now() else null end;
  else
    new.resolved_at := old.resolved_at;
  end if;

  return new;
end;
$$;

create trigger maintenance_issues_before_write
  before insert or update on public.maintenance_issues
  for each row execute function private.maintenance_issues_before_write();

-- -----------------------------------------------------------------------------
-- RLS das operações
--   Ler: qualquer membro ativo (despesas: só administradores e gestores).
--   Criar/editar/apagar: administradores e gestores.
--   Colaboradores: atualizam as tarefas atribuídas a si e reportam problemas.
-- -----------------------------------------------------------------------------

alter table public.properties enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.inspections enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.expenses enable row level security;
alter table public.attachments enable row level security;

-- Propriedades, modelos de checklist: membros leem; gestores escrevem.
do $$
declare
  t text;
begin
  foreach t in array array['properties', 'checklist_templates', 'checklist_template_items'] loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated
         using (business_id in (select private.user_business_ids()))', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated
         with check (business_id in (select private.user_business_ids_with_role(array[''admin'', ''manager''])))', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated
         using (business_id in (select private.user_business_ids_with_role(array[''admin'', ''manager''])))
         with check (business_id in (select private.user_business_ids_with_role(array[''admin'', ''manager''])))', t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated
         using (business_id in (select private.user_business_ids_with_role(array[''admin'', ''manager''])))', t);
  end loop;
end;
$$;

-- Tarefas
create policy tasks_select on public.tasks
  for select to authenticated
  using (business_id in (select private.user_business_ids()));

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

create policy tasks_update on public.tasks
  for update to authenticated
  using (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (assignee_id = (select auth.uid()) and business_id in (select private.user_business_ids()))
  )
  with check (business_id in (select private.user_business_ids()));

create policy tasks_delete on public.tasks
  for delete to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

-- Itens de checklist de tarefas
create policy task_checklist_items_select on public.task_checklist_items
  for select to authenticated
  using (business_id in (select private.user_business_ids()));

create policy task_checklist_items_insert on public.task_checklist_items
  for insert to authenticated
  with check (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

create policy task_checklist_items_update on public.task_checklist_items
  for update to authenticated
  using (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (
      business_id in (select private.user_business_ids())
      and exists (
        select 1 from public.tasks t
        where t.id = task_id and t.assignee_id = (select auth.uid())
      )
    )
  )
  with check (business_id in (select private.user_business_ids()));

create policy task_checklist_items_delete on public.task_checklist_items
  for delete to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

-- Inspeções: o inspetor (responsável da tarefa) regista o resultado.
create policy inspections_select on public.inspections
  for select to authenticated
  using (business_id in (select private.user_business_ids()));

create policy inspections_write on public.inspections
  for all to authenticated
  using (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (
      business_id in (select private.user_business_ids())
      and exists (
        select 1 from public.tasks t
        where t.id = task_id and t.assignee_id = (select auth.uid())
      )
    )
  )
  with check (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (
      business_id in (select private.user_business_ids())
      and exists (
        select 1 from public.tasks t
        where t.id = task_id and t.assignee_id = (select auth.uid())
      )
    )
  );

-- Manutenção: qualquer membro reporta; gestores e o responsável atualizam.
create policy maintenance_issues_select on public.maintenance_issues
  for select to authenticated
  using (business_id in (select private.user_business_ids()));

create policy maintenance_issues_insert on public.maintenance_issues
  for insert to authenticated
  with check (
    business_id in (select private.user_business_ids())
    and reported_by = (select auth.uid())
  );

create policy maintenance_issues_update on public.maintenance_issues
  for update to authenticated
  using (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (assignee_id = (select auth.uid()) and business_id in (select private.user_business_ids()))
  )
  with check (business_id in (select private.user_business_ids()));

create policy maintenance_issues_delete on public.maintenance_issues
  for delete to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

-- Despesas: apenas administradores e gestores.
create policy expenses_all on public.expenses
  for all to authenticated
  using (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])))
  with check (business_id in (select private.user_business_ids_with_role(array['admin', 'manager'])));

-- Anexos: membros veem e adicionam (comprovativos de despesas só gestores).
create policy attachments_select on public.attachments
  for select to authenticated
  using (
    business_id in (select private.user_business_ids())
    and (
      expense_id is null
      or business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    )
  );

create policy attachments_insert on public.attachments
  for insert to authenticated
  with check (
    business_id in (select private.user_business_ids())
    and created_by = (select auth.uid())
    and (
      expense_id is null
      or business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    )
  );

create policy attachments_delete on public.attachments
  for delete to authenticated
  using (
    business_id in (select private.user_business_ids_with_role(array['admin', 'manager']))
    or (created_by = (select auth.uid()) and business_id in (select private.user_business_ids()))
  );

revoke all on
  public.properties, public.checklist_templates, public.checklist_template_items, public.tasks,
  public.task_checklist_items, public.inspections, public.maintenance_issues, public.expenses,
  public.attachments
from anon;

-- -----------------------------------------------------------------------------
-- Criação de empresa (RPC): empresa + administrador + listas por defeito,
-- numa única transação.
-- -----------------------------------------------------------------------------

create or replace function public.create_business(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business_id uuid;
  v_template_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.businesses (name, created_by)
  values (btrim(p_name), v_user_id)
  returning id into v_business_id;

  insert into public.memberships (business_id, user_id, role)
  values (v_business_id, v_user_id, 'admin');

  update public.profiles set last_business_id = v_business_id where id = v_user_id;

  -- Lista de limpeza por defeito (editável pela empresa).
  insert into public.checklist_templates (business_id, name, kind, created_by)
  values (v_business_id, 'Limpeza padrão', 'cleaning', v_user_id)
  returning id into v_template_id;

  insert into public.checklist_template_items (business_id, template_id, label, position)
  select v_business_id, v_template_id, label, ord - 1
  from unnest(array[
    'Limpar quartos',
    'Limpar casas de banho',
    'Limpar cozinha',
    'Substituir roupa de cama',
    'Repor toalhas',
    'Verificar consumíveis',
    'Confirmar que todas as divisões estão preparadas'
  ]) with ordinality as items (label, ord);

  -- Lista de inspeção por defeito.
  insert into public.checklist_templates (business_id, name, kind, created_by)
  values (v_business_id, 'Inspeção padrão', 'inspection', v_user_id)
  returning id into v_template_id;

  insert into public.checklist_template_items (business_id, template_id, label, position)
  select v_business_id, v_template_id, label, ord - 1
  from unnest(array[
    'Limpeza geral aprovada',
    'Roupa de cama e toalhas no lugar',
    'Consumíveis repostos',
    'Equipamentos a funcionar',
    'Sem danos visíveis',
    'Chaves e acessos verificados'
  ]) with ordinality as items (label, ord);

  return v_business_id;
end;
$$;

revoke all on function public.create_business(text) from public, anon;
grant execute on function public.create_business(text) to authenticated;

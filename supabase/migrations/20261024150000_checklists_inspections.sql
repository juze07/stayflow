-- =============================================================================
-- StayFlow Fase 4: listas de verificação, inspeções e ligação à manutenção.
-- As regras ficam na base de dados para valerem em qualquer cliente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tarefas: coerência do modelo de lista, do tipo e do problema de manutenção.
-- -----------------------------------------------------------------------------

create or replace function private.tasks_validate_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template_kind text;
  v_issue_property uuid;
begin
  -- Limpezas e inspeções têm lista e/ou registo próprios: o tipo não muda depois de criado.
  if tg_op = 'UPDATE' and new.type is distinct from old.type
     and (old.type in ('cleaning', 'inspection') or new.type in ('cleaning', 'inspection')) then
    raise exception 'task_type_locked' using errcode = 'P0001';
  end if;

  if new.checklist_template_id is not null then
    select t.kind into v_template_kind
    from public.checklist_templates t
    where t.id = new.checklist_template_id;

    if v_template_kind is distinct from new.type then
      raise exception 'checklist_kind_mismatch' using errcode = 'P0001';
    end if;
  end if;

  -- A lista é copiada na criação; depois de existir, o modelo já não muda.
  if tg_op = 'UPDATE' and new.checklist_template_id is distinct from old.checklist_template_id then
    raise exception 'checklist_template_locked' using errcode = 'P0001';
  end if;

  if new.maintenance_issue_id is not null then
    select i.property_id into v_issue_property
    from public.maintenance_issues i
    where i.id = new.maintenance_issue_id;

    if v_issue_property is distinct from new.property_id then
      raise exception 'maintenance_issue_property_mismatch' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger tasks_validate_links
  before insert or update on public.tasks
  for each row execute function private.tasks_validate_links();

-- Depois de criar a tarefa: copia a lista do modelo e cria o registo da inspeção.
create or replace function private.tasks_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.checklist_template_id is not null then
    insert into public.task_checklist_items (business_id, task_id, label, position, is_required)
    select new.business_id, new.id, i.label, i.position, i.is_required
    from public.checklist_template_items i
    where i.template_id = new.checklist_template_id
    order by i.position;
  end if;

  if new.type = 'inspection' then
    insert into public.inspections (business_id, task_id, created_by)
    values (new.business_id, new.id, new.created_by);
  end if;

  return null;
end;
$$;

create trigger tasks_after_insert
  after insert on public.tasks
  for each row execute function private.tasks_after_insert();

-- Inspeções criadas antes desta migração também ganham o seu registo.
insert into public.inspections (business_id, task_id, created_by)
select t.business_id, t.id, t.created_by
from public.tasks t
where t.type = 'inspection'
  and not exists (select 1 from public.inspections i where i.task_id = t.id);

-- -----------------------------------------------------------------------------
-- Inspeções: o resultado fica fechado quando a tarefa termina.
-- -----------------------------------------------------------------------------

create or replace function private.inspections_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_status text;
begin
  select t.type, t.status into v_type, v_status from public.tasks t where t.id = new.task_id;

  if v_type is distinct from 'inspection' then
    raise exception 'inspection must belong to an inspection task' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and v_status in ('completed', 'cancelled')
     and (new.result is distinct from old.result or new.observations is distinct from old.observations) then
    raise exception 'task_closed' using errcode = 'P0001';
  end if;

  -- Um resultado com reservas ou reprovado tem de explicar porquê.
  if new.result in ('approved_with_notes', 'failed') and coalesce(btrim(new.observations), '') = '' then
    raise exception 'inspection_observations_required' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and new.task_id is distinct from old.task_id then
    raise exception 'inspection_task_locked' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Problemas de manutenção: a inspeção de origem tem de ser da mesma propriedade.
-- -----------------------------------------------------------------------------

create or replace function private.maintenance_issues_validate_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_property uuid;
begin
  if new.source_inspection_id is not null
     and (tg_op = 'INSERT' or new.source_inspection_id is distinct from old.source_inspection_id) then
    select t.property_id into v_property
    from public.inspections i
    join public.tasks t on t.id = i.task_id
    where i.id = new.source_inspection_id;

    if v_property is distinct from new.property_id then
      raise exception 'inspection_property_mismatch' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger maintenance_issues_validate_source
  before insert or update on public.maintenance_issues
  for each row execute function private.maintenance_issues_validate_source();

-- -----------------------------------------------------------------------------
-- Guardar um modelo de lista (nome + itens) de uma só vez.
-- SECURITY INVOKER: o RLS decide quem pode (administradores e gestores).
-- -----------------------------------------------------------------------------

create or replace function public.save_checklist_template(
  p_business_id uuid,
  p_template_id uuid,
  p_kind text,
  p_name text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_template_id uuid := p_template_id;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'checklist_items_required' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'checklist_too_many_items' using errcode = '22023';
  end if;

  if v_template_id is null then
    insert into public.checklist_templates (business_id, name, kind)
    values (p_business_id, btrim(p_name), p_kind)
    returning id into v_template_id;
  else
    update public.checklist_templates
    set name = btrim(p_name)
    where id = v_template_id and business_id = p_business_id;

    if not found then
      raise exception 'checklist_template_not_found' using errcode = 'P0002';
    end if;

    -- As tarefas já criadas têm a sua própria cópia; só os modelos mudam.
    delete from public.checklist_template_items where template_id = v_template_id;
  end if;

  insert into public.checklist_template_items (business_id, template_id, label, position, is_required)
  select p_business_id, v_template_id, btrim(item ->> 'label'), (ord - 1)::integer,
         coalesce((item ->> 'required')::boolean, true)
  from jsonb_array_elements(p_items) with ordinality as items (item, ord);

  return v_template_id;
end;
$$;

revoke all on function public.save_checklist_template(uuid, uuid, text, text, jsonb) from public, anon;
grant execute on function public.save_checklist_template(uuid, uuid, text, text, jsonb) to authenticated;

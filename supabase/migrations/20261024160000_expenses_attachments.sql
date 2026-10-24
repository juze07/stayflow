-- Fase 5: regras das despesas, relatório de despesas e validação dos anexos.

-- -----------------------------------------------------------------------------
-- Despesas: a despesa de um problema de manutenção fica na mesma propriedade.
-- -----------------------------------------------------------------------------

create or replace function private.expenses_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_issue_property uuid;
begin
  if new.maintenance_issue_id is not null
     and (tg_op = 'INSERT'
          or new.maintenance_issue_id is distinct from old.maintenance_issue_id
          or new.property_id is distinct from old.property_id) then
    select m.property_id into v_issue_property
    from public.maintenance_issues m
    where m.id = new.maintenance_issue_id and m.business_id = new.business_id;

    if new.property_id is null then
      new.property_id := v_issue_property;
    elsif v_issue_property is not null and new.property_id <> v_issue_property then
      raise exception 'expense_property_mismatch' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger expenses_before_write
  before insert or update of property_id, maintenance_issue_id on public.expenses
  for each row execute function private.expenses_before_write();

create index expenses_issue_idx on public.expenses (maintenance_issue_id) where maintenance_issue_id is not null;

-- -----------------------------------------------------------------------------
-- Relatório: totais por mês, propriedade e categoria (o RLS limita a gestores).
-- -----------------------------------------------------------------------------

create or replace function public.expense_report(
  p_business_id uuid,
  p_from date,
  p_to date
)
returns table (month date, property_id uuid, category text, total_cents bigint, expense_count integer)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 1100 then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  return query
  select
    date_trunc('month', e.incurred_on::timestamp)::date,
    e.property_id,
    e.category,
    sum(e.amount_cents)::bigint,
    count(*)::integer
  from public.expenses e
  where e.business_id = p_business_id
    and e.incurred_on between p_from and p_to
  group by 1, 2, 3
  order by 1, 2, 3;
end;
$$;

revoke all on function public.expense_report(uuid, date, date) from public, anon;
grant execute on function public.expense_report(uuid, date, date) to authenticated;

-- -----------------------------------------------------------------------------
-- Anexos: caminho, permissão e ficheiro verificados na base de dados.
-- Caminho: {business_id}/{pasta da entidade}/{id da entidade}/{ficheiro}
-- -----------------------------------------------------------------------------

create or replace function private.attachments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_folder text;
  v_parent uuid;
  v_uid uuid := auth.uid();
  v_allowed boolean := true;
  v_metadata jsonb;
begin
  if new.task_id is not null then
    v_folder := 'tasks'; v_parent := new.task_id;
  elsif new.inspection_id is not null then
    v_folder := 'inspections'; v_parent := new.inspection_id;
  elsif new.maintenance_issue_id is not null then
    v_folder := 'maintenance'; v_parent := new.maintenance_issue_id;
  elsif new.expense_id is not null then
    v_folder := 'expenses'; v_parent := new.expense_id;
  else
    v_folder := 'properties'; v_parent := new.property_id;
  end if;

  if split_part(new.storage_path, '/', 1) <> new.business_id::text
     or split_part(new.storage_path, '/', 2) <> v_folder
     or split_part(new.storage_path, '/', 3) <> v_parent::text
     or split_part(new.storage_path, '/', 4) = ''
     or split_part(new.storage_path, '/', 5) <> '' then
    raise exception 'attachment_path_mismatch' using errcode = 'P0001';
  end if;

  -- Um colaborador só anexa às suas tarefas e aos problemas que reportou ou tem atribuídos.
  if v_uid is not null and not private.has_role(new.business_id, array['admin', 'manager']) then
    if new.task_id is not null then
      v_allowed := exists (select 1 from public.tasks t where t.id = new.task_id and t.assignee_id = v_uid);
    elsif new.inspection_id is not null then
      v_allowed := exists (
        select 1 from public.inspections i
        join public.tasks t on t.id = i.task_id
        where i.id = new.inspection_id and t.assignee_id = v_uid
      );
    elsif new.maintenance_issue_id is not null then
      v_allowed := exists (
        select 1 from public.maintenance_issues m
        where m.id = new.maintenance_issue_id and (m.reported_by = v_uid or m.assignee_id = v_uid)
      );
    else
      v_allowed := false;
    end if;

    if not v_allowed then
      raise exception 'attachment_not_allowed' using errcode = '42501';
    end if;
  end if;

  if (
    select count(*) from public.attachments a
    where a.task_id is not distinct from new.task_id
      and a.inspection_id is not distinct from new.inspection_id
      and a.maintenance_issue_id is not distinct from new.maintenance_issue_id
      and a.expense_id is not distinct from new.expense_id
      and a.property_id is not distinct from new.property_id
  ) >= 20 then
    raise exception 'attachment_limit' using errcode = 'P0001';
  end if;

  -- O ficheiro tem de existir e ter sido enviado por quem o regista.
  select o.metadata into v_metadata
  from storage.objects o
  where o.bucket_id = 'attachments'
    and o.name = new.storage_path
    and (v_uid is null or o.owner_id = v_uid::text);

  if not found then
    raise exception 'attachment_file_missing' using errcode = 'P0001';
  end if;

  -- Tamanho e tipo vêm do Storage, não do cliente.
  new.size_bytes := coalesce((v_metadata ->> 'size')::integer, new.size_bytes);
  new.mime_type := coalesce(v_metadata ->> 'mimetype', new.mime_type);
  return new;
end;
$$;

create trigger attachments_before_insert
  before insert on public.attachments
  for each row execute function private.attachments_before_insert();

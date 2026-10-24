-- Uma propriedade arquivada mantém o histórico, mas não recebe tarefas novas.

create or replace function private.tasks_require_active_property()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.property_id is distinct from old.property_id)
     and exists (
       select 1 from public.properties p
       where p.id = new.property_id and p.archived_at is not null
     ) then
    raise exception 'property_archived' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger tasks_require_active_property
  before insert or update of property_id on public.tasks
  for each row execute function private.tasks_require_active_property();

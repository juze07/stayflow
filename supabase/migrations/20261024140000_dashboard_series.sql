-- =============================================================================
-- StayFlow: séries para os gráficos do dashboard
-- Funções SECURITY INVOKER: correm com as permissões de quem chama, por isso o
-- RLS continua a aplicar-se (outra empresa recebe zeros; colaboradores não
-- veem despesas).
-- =============================================================================

-- Tarefas agendadas e concluídas por dia, no fuso horário da empresa.
create or replace function public.dashboard_task_series(
  p_business_id uuid,
  p_from date,
  p_to date,
  p_timezone text default 'Europe/Lisbon'
)
returns table (day date, scheduled integer, completed integer)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_start timestamptz := p_from::timestamp at time zone p_timezone;
  v_end timestamptz := (p_to + 1)::timestamp at time zone p_timezone;
begin
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ),
  scheduled as (
    select (t.scheduled_at at time zone p_timezone)::date as day, count(*)::integer as total
    from public.tasks t
    where t.business_id = p_business_id
      and t.status <> 'cancelled'
      and t.scheduled_at >= v_start
      and t.scheduled_at < v_end
    group by 1
  ),
  completed as (
    select (t.completed_at at time zone p_timezone)::date as day, count(*)::integer as total
    from public.tasks t
    where t.business_id = p_business_id
      and t.status = 'completed'
      and t.completed_at >= v_start
      and t.completed_at < v_end
    group by 1
  )
  select d.day, coalesce(s.total, 0), coalesce(c.total, 0)
  from days d
  left join scheduled s on s.day = d.day
  left join completed c on c.day = d.day
  order by d.day;
end;
$$;

-- Despesas por dia (em cêntimos).
create or replace function public.dashboard_expense_series(
  p_business_id uuid,
  p_from date,
  p_to date
)
returns table (day date, amount_cents bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ),
  totals as (
    select e.incurred_on as day, sum(e.amount_cents)::bigint as total
    from public.expenses e
    where e.business_id = p_business_id
      and e.incurred_on between p_from and p_to
    group by 1
  )
  select d.day, coalesce(t.total, 0::bigint)
  from days d
  left join totals t on t.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.dashboard_task_series(uuid, date, date, text) from public, anon;
revoke all on function public.dashboard_expense_series(uuid, date, date) from public, anon;
grant execute on function public.dashboard_task_series(uuid, date, date, text) to authenticated;
grant execute on function public.dashboard_expense_series(uuid, date, date) to authenticated;


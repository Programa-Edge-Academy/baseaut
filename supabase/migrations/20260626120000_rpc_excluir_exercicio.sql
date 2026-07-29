-- Apply with `npx supabase db push` or run manually in the Supabase SQL editor.

-- RPC that soft-deletes an exercise and removes it from every circuit it
-- belongs to, renumbering each affected circuit's remaining items so their
-- `ordem` stays contiguous and 1-based (matching how the app assigns order).
-- Runs in a single transaction so the exercise can never be left referencing
-- (or referenced by) a circuit in an inconsistent state.
create or replace function excluir_exercicio(p_exercicio_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_circ_ids uuid[];
begin
  update public.exercicios
  set ativo = false
  where id = p_exercicio_id;

  select array_agg(distinct circuito_id) into v_circ_ids
  from public.itens_circuito
  where exercicio_id = p_exercicio_id;

  if v_circ_ids is null then
    return;
  end if;

  delete from public.itens_circuito
  where exercicio_id = p_exercicio_id;

  with ordered as (
    select id,
           (row_number() over (
             partition by circuito_id
             order by ordem, id
           ))::int as new_ordem
    from public.itens_circuito
    where circuito_id = any(v_circ_ids)
  )
  update public.itens_circuito ic
  set ordem = ordered.new_ordem
  from ordered
  where ic.id = ordered.id
    and ic.ordem <> ordered.new_ordem;
end;
$$;

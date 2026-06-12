-- Apply with `npx supabase db push` or run manually in the Supabase SQL editor.

-- RPC that replaces a circuit's items transactionally, preventing partial updates
-- if the operation fails between the delete and re-insert steps.
create or replace function substituir_itens_circuito(
  p_circuito_id uuid,
  p_itens jsonb -- [{"exercicio_id": "...", "ordem": 1}, ...]
) returns void
language plpgsql security invoker as $$
begin
  delete from itens_circuito where circuito_id = p_circuito_id;
  insert into itens_circuito (circuito_id, exercicio_id, ordem)
  select p_circuito_id,
         (item->>'exercicio_id')::uuid,
         (item->>'ordem')::int
  from jsonb_array_elements(p_itens) as item;
end;
$$;

-- Partial unique index preventing duplicate MABC circuits per team.
-- Allows race-condition detection via unique-violation (code 23505).
create unique index if not exists uniq_circuitos_equipe_tipo_mabc
  on circuitos (equipe_id, tipo)
  where tipo in ('mabc_1','mabc_2','mabc_3') and ativo;

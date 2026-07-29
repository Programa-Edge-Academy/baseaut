-- Garante que cada exercício aparece no máximo uma vez por sessão,
-- permitindo upsert idempotente ao persistir execuções incrementalmente
-- e ao retomar uma sessão interrompida.
ALTER TABLE public.execucoes_exercicio
  ADD CONSTRAINT uq_execucoes_sessao_exercicio
  UNIQUE (sessao_id, exercicio_id);

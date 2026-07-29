-- ════════════════════════════════════════════════════════════════════
-- Permite múltiplas execuções do mesmo exercício na mesma sessão
-- ════════════════════════════════════════════════════════════════════
-- A constraint UNIQUE (sessao_id, exercicio_id) impedia repetir um exercício
-- na mesma sessão (botão "Repetir exercício") e registrar várias atividades de
-- engajamento (que usam um exercício-sentinela). A persistência passa a inserir
-- uma linha nova por execução, em vez de upsert idempotente.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.execucoes_exercicio
  DROP CONSTRAINT IF EXISTS uq_execucoes_sessao_exercicio;

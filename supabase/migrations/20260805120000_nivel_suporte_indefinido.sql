-- =======================================================================
-- Migration: nível de suporte TEA passa a aceitar "Indefinido"
-- =======================================================================
-- Nem toda criança chega ao programa com o nível de suporte já definido em
-- laudo. Até aqui o cadastro obrigava a escolher entre os níveis 1, 2 e 3,
-- o que forçava o avaliador a chutar um nível — e o chute vira histórico
-- clínico. O ENUM ganha um valor explícito para esse caso.
--
-- A coluna alunos.nivel_suporte é NOT NULL, então "não sei ainda" não pode
-- ser representado por NULL: precisa ser um valor do próprio tipo.
--
-- Mudança puramente aditiva: nenhum registro existente é alterado e os três
-- níveis continuam válidos.

ALTER TYPE nivel_suporte_tea ADD VALUE IF NOT EXISTS 'indefinido';

COMMENT ON TYPE nivel_suporte_tea IS
  'Nível de suporte TEA do aluno. "indefinido" cobre quem ainda não tem o nível determinado.';

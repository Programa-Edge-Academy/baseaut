-- =======================================================================
-- Migration: campo "Repetições" nos exercícios
-- =======================================================================
-- O campo de duração máxima (duracao_segundos) deixa de ser usado pelo app:
-- passa a existir "repeticoes", que indica quantas vezes o exercício é
-- realizado durante a sessão. É apenas informativo (entra na descrição do
-- exercício) e não afeta a execução da sessão nem a cronometragem.
--
-- duracao_segundos é mantida intacta, sem DROP: os exercícios já cadastrados
-- guardam ali um valor em segundos, que não tem o mesmo significado de
-- repetições e não pode ser reaproveitado como tal.

ALTER TABLE public.exercicios
  ADD COLUMN IF NOT EXISTS repeticoes INTEGER;

-- Opcional por definição, mas quando preenchido precisa ser um número de
-- repetições plausível.
ALTER TABLE public.exercicios
  DROP CONSTRAINT IF EXISTS chk_repeticoes_intervalo;

ALTER TABLE public.exercicios
  ADD CONSTRAINT chk_repeticoes_intervalo
  CHECK (repeticoes IS NULL OR (repeticoes > 0 AND repeticoes <= 999));

COMMENT ON COLUMN public.exercicios.repeticoes IS
  'Quantas vezes o exercício é realizado durante a sessão. Informativo: não afeta a execução.';

COMMENT ON COLUMN public.exercicios.duracao_segundos IS
  'OBSOLETO: mantido apenas para os registros históricos. O app usa "repeticoes".';

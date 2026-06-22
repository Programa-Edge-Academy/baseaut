-- ════════════════════════════════════════════════════════════════════
-- sessoes.tempo_total — duração total da sessão em segundos
-- ════════════════════════════════════════════════════════════════════
-- Contabilizada por um cronômetro próprio enquanto a sessão está aberta no app
-- (pausa quando o app é fechado, ao atingir 3h ou quando a sessão é encerrada).
-- Também é replicada na resposta da pergunta de RC intitulada "Tempo da sessão".
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.sessoes
  ADD COLUMN IF NOT EXISTS tempo_total integer
    CHECK (tempo_total IS NULL OR tempo_total >= 0);

COMMENT ON COLUMN public.sessoes.tempo_total IS
  'Duração total da sessão em segundos (cronômetro do app; máx. 3h = 10800).';

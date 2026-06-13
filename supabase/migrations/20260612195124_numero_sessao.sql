-- 1. Cria a coluna
ALTER TABLE public.sessoes ADD COLUMN IF NOT EXISTS numero_sessao INTEGER;

-- 2. Backfill: Numera o histórico retroativo ordenando por data
WITH numeracao AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY aluno_id ORDER BY COALESCE(data_inicio, data_agendada) ASC) as num
  FROM public.sessoes
)
UPDATE public.sessoes s
SET numero_sessao = n.num
FROM numeracao n
WHERE s.id = n.id;

-- 3. Função do Robô (Trigger)
CREATE OR REPLACE FUNCTION public.trg_set_numero_sessao()
RETURNS TRIGGER AS $$
BEGIN
  -- Descobre o maior número já usado por esse aluno e soma 1
  SELECT COALESCE(MAX(numero_sessao), 0) + 1
  INTO NEW.numero_sessao
  FROM public.sessoes
  WHERE aluno_id = NEW.aluno_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Anexa o Robô à tabela de Sessões
DROP TRIGGER IF EXISTS trigger_set_numero_sessao ON public.sessoes;
CREATE TRIGGER trigger_set_numero_sessao
  BEFORE INSERT ON public.sessoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_numero_sessao();
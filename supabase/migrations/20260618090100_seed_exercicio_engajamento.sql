-- ════════════════════════════════════════════════════════════════════
-- Exercício-sentinela "Atividade de Engajamento" (por equipe)
-- ════════════════════════════════════════════════════════════════════
-- Atividade de engajamento é exclusiva de circuitos semi-estruturados e não é
-- um exercício comum, mas precisa de uma linha em execucoes_exercicio (que tem
-- exercicio_id obrigatório). Solução: um exercício reservado por equipe, com:
--   • tag = 'engajamento'  → identifica o sentinela de forma inequívoca
--   • ativo = false        → some automaticamente da tela de exercícios e da
--                            criação de circuitos (ambas filtram ativo = true)
-- ════════════════════════════════════════════════════════════════════

-- 1. Semeia para as equipes existentes (idempotente por tag).
INSERT INTO public.exercicios (titulo, descricao, equipe_id, ativo, tag)
SELECT
  'Atividade de Engajamento',
  'Atividade avulsa de engajamento registrada durante circuitos semi-estruturados.',
  e.id,
  false,
  'engajamento'
FROM public.equipes e
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercicios x
  WHERE x.equipe_id = e.id AND x.tag = 'engajamento'
);

-- 2. Trigger para criar o sentinela automaticamente em novas equipes.
CREATE OR REPLACE FUNCTION public.handle_equipe_created_engajamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.exercicios (titulo, descricao, equipe_id, ativo, tag)
  VALUES (
    'Atividade de Engajamento',
    'Atividade avulsa de engajamento registrada durante circuitos semi-estruturados.',
    NEW.id,
    false,
    'engajamento'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_equipe_created_engajamento ON public.equipes;
CREATE TRIGGER on_equipe_created_engajamento
  AFTER INSERT ON public.equipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_equipe_created_engajamento();

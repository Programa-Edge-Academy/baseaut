-- Hotfix: seed e trigger de engajamento não incluíam subtags (NOT NULL).
-- Reaplica o INSERT para equipes sem sentinela e recria o trigger com subtags = [].

INSERT INTO public.exercicios (titulo, descricao, equipe_id, ativo, tag, subtags)
SELECT
  'Atividade de Engajamento',
  'Atividade avulsa de engajamento registrada durante circuitos semi-estruturados.',
  e.id,
  false,
  'engajamento',
  ARRAY[]::text[]
FROM public.equipes e
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercicios x
  WHERE x.equipe_id = e.id AND x.tag = 'engajamento'
);

CREATE OR REPLACE FUNCTION public.handle_equipe_created_engajamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.exercicios (titulo, descricao, equipe_id, ativo, tag, subtags)
  VALUES (
    'Atividade de Engajamento',
    'Atividade avulsa de engajamento registrada durante circuitos semi-estruturados.',
    NEW.id,
    false,
    'engajamento',
    ARRAY[]::text[]
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_equipe_created_engajamento ON public.equipes;
CREATE TRIGGER on_equipe_created_engajamento
  AFTER INSERT ON public.equipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_equipe_created_engajamento();

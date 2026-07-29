-- =======================================================================
-- Migration: múltiplas tags principais por exercício
-- =======================================================================
-- Antes: uma única tag (coluna `tag`) e um array plano de subtags, sem
-- vínculo entre cada subtag e a tag a que pertence.
-- Agora: coluna `tags` JSONB no formato {"Força": ["locomotor"], ...},
-- com 1 a 3 tags principais e 1 a 3 subtags em cada uma.
--
-- `tag` e `subtags` são mantidas e continuam preenchidas pelo app com a
-- PRIMEIRA tag e suas subtags. Isso preserva a sentinela tag='engajamento'
-- (usada pelo trigger de criação de equipe e pelos seeds) e todo consumo
-- existente da coluna, evitando reescrever consultas nesta rodada.

ALTER TABLE public.exercicios
  ADD COLUMN IF NOT EXISTS tags JSONB;

-- ----------------------------------------------------------------------
-- Validação: 1-3 tags principais, cada uma com 1-3 subtags válidas.
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exercicio_tags_validas(p_tags JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    jsonb_typeof(p_tags) = 'object'
    AND (SELECT count(*) FROM jsonb_object_keys(p_tags)) BETWEEN 1 AND 3
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(p_tags) AS entry(chave, valor)
      WHERE
        entry.chave NOT IN ('Força', 'Equilíbrio', 'Coordenação')
        OR jsonb_typeof(entry.valor) <> 'array'
        OR jsonb_array_length(entry.valor) NOT BETWEEN 1 AND 3
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(entry.valor) AS sub(nome)
          WHERE sub.nome NOT IN ('locomotor', 'estabilizador', 'manipulativo')
        )
    );
$$;

COMMENT ON FUNCTION public.exercicio_tags_validas(JSONB) IS
  'Valida o JSONB de tags de um exercício: 1-3 tags principais, cada uma com 1-3 subtags conhecidas.';

-- ----------------------------------------------------------------------
-- Backfill a partir de tag + subtags.
-- ----------------------------------------------------------------------
-- Exercícios comuns: a tag atual vira a única chave, com as subtags que já
-- tinha. Se por algum motivo estiver sem subtags, recebe a subtag padrão
-- usada no backfill original ('estabilizador'), já que agora é obrigatória.
UPDATE public.exercicios
SET tags = jsonb_build_object(
  tag,
  to_jsonb(
    CASE
      WHEN subtags IS NULL OR array_length(subtags, 1) IS NULL
        THEN ARRAY['estabilizador']::text[]
      ELSE subtags
    END
  )
)
WHERE tags IS NULL
  AND tag IN ('Força', 'Equilíbrio', 'Coordenação');

-- Sentinela de engajamento: não é um exercício do catálogo (ativo = false,
-- não aparece na listagem nem é editável), então fica com objeto vazio.
UPDATE public.exercicios
SET tags = '{}'::jsonb
WHERE tags IS NULL;

ALTER TABLE public.exercicios
  ALTER COLUMN tags SET DEFAULT '{}'::jsonb;

ALTER TABLE public.exercicios
  ALTER COLUMN tags SET NOT NULL;

-- A regra vale para o catálogo; a sentinela de engajamento fica de fora.
ALTER TABLE public.exercicios
  DROP CONSTRAINT IF EXISTS chk_tags_estrutura;

ALTER TABLE public.exercicios
  ADD CONSTRAINT chk_tags_estrutura
  CHECK (tag = 'engajamento' OR public.exercicio_tags_validas(tags));

-- Índice GIN para filtrar por tag/subtag sem varrer a tabela.
CREATE INDEX IF NOT EXISTS idx_exercicios_tags ON public.exercicios USING GIN (tags);

COMMENT ON COLUMN public.exercicios.tags IS
  'Tags principais e suas subtags: {"Força": ["locomotor"], ...}. 1-3 tags, 1-3 subtags cada.';

COMMENT ON COLUMN public.exercicios.tag IS
  'Primeira tag principal (espelha a 1ª chave de "tags"). Mantida para a sentinela engajamento e consumidores antigos.';

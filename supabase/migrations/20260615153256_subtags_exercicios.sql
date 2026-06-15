-- =======================================================================
-- Migration: Adição de Subtags Múltiplas e Obrigatórias em Exercícios
-- =======================================================================

-- 1. Cria a coluna permitindo NULL temporariamente
ALTER TABLE public.exercicios
  ADD COLUMN IF NOT EXISTS subtags TEXT[];

-- 2. Backfill: Define uma subtag padrão para os exercícios que já existem.
-- (Isso evita que o banco quebre ao aplicar o NOT NULL na próxima etapa).
UPDATE public.exercicios
SET subtags = ARRAY['estabilizador']
WHERE subtags IS NULL;

-- 3. Aplica a trava de obrigatoriedade (NOT NULL)
ALTER TABLE public.exercicios
  ALTER COLUMN subtags SET NOT NULL;

-- 4. Trava de Segurança 1: Impede que o front-end mande um array vazio []
ALTER TABLE public.exercicios
  ADD CONSTRAINT chk_subtags_nao_vazio 
  CHECK (array_length(subtags, 1) > 0);

-- 5. Trava de Segurança 2: Garante que só as 3 subtags válidas entrem no banco
-- O operador <@ significa "está contido em".
ALTER TABLE public.exercicios
  ADD CONSTRAINT chk_subtags_valores_permitidos 
  CHECK (subtags <@ ARRAY['locomotor', 'estabilizador', 'manipulativo']::text[]);

-- 6. Limpeza e Trava de Consistência para a coluna 'tag'
-- Ajusta qualquer lixo antigo ou nulo para um valor seguro
UPDATE public.exercicios
SET tag = 'Coordenação'
WHERE tag NOT IN ('Força', 'Equilíbrio', 'Coordenação') 
   OR tag IS NULL;

-- Agora aplica a trava com segurança
ALTER TABLE public.exercicios
  ADD CONSTRAINT chk_tag_valores_permitidos 
  CHECK (tag IN ('Força', 'Equilíbrio', 'Coordenação'));
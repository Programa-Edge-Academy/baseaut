-- 20260501_000016_create_itens_circuito.sql
CREATE TABLE public.itens_circuito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuito_id UUID NOT NULL REFERENCES public.circuitos(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES public.exercicios(id) ON DELETE RESTRICT,
  ordem INTEGER NOT NULL DEFAULT 0,
  duracao_estimada INTEGER, -- Em segundos
  repeticoes INTEGER,
  UNIQUE (circuito_id, exercicio_id)
);
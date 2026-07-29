-- 20260501_000014_create_exercicios.sql
CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  midia_url TEXT,
  instrucoes_verbais TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
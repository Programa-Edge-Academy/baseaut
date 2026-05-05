-- 20260501_000007_create_equipes.sql
CREATE TABLE public.equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  coordenador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 20260501_000010_create_alunos.sql
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE RESTRICT,
  nivel_suporte nivel_suporte_tea NOT NULL,
  diagnostico_detalhado TEXT,
  observacoes_clinicas TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
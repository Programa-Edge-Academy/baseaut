-- 20260501_000011_create_avaliacoes.sql
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumo_progresso TEXT NOT NULL,
  metricas_alcancadas JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
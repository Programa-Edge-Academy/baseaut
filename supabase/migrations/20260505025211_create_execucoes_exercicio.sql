-- 20260501_000018_create_execucoes_exercicio.sql
CREATE TABLE public.execucoes_exercicio (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id              UUID        NOT NULL REFERENCES public.sessoes(id)    ON DELETE CASCADE,
  exercicio_id           UUID        NOT NULL REFERENCES public.exercicios(id) ON DELETE RESTRICT,
  ordem_execucao         INTEGER     NOT NULL,
  duracao_real_segundos  INTEGER,
  tempo_maximo_atingido  BOOLEAN     NOT NULL DEFAULT false,
  video_url              TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
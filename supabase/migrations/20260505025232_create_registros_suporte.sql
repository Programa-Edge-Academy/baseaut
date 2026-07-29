-- 20260501_000019_create_registros_suporte.sql
CREATE TABLE public.registros_suporte (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id  UUID         NOT NULL REFERENCES public.execucoes_exercicio(id) ON DELETE CASCADE,
  tipo         tipo_suporte NOT NULL,
  intensidade  INTEGER      NOT NULL DEFAULT 1 CHECK (intensidade BETWEEN 1 AND 5),
  observacao   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
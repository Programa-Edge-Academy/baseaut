-- 20260501_000021_create_relatorios.sql
CREATE TABLE public.relatorios (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id           UUID        NOT NULL REFERENCES public.alunos(id)    ON DELETE RESTRICT,
  created_by         UUID        NOT NULL REFERENCES public.profiles(id),
  titulo             TEXT        NOT NULL,
  formato_exportacao TEXT,
  data_inicio        DATE        NOT NULL,
  data_fim           DATE        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
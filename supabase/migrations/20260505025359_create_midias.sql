-- 20260501_000023_create_midias.sql
CREATE TABLE public.midias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  secao_id    UUID        REFERENCES public.secoes_relatorio(id) ON DELETE CASCADE,
  url_arquivo TEXT        NOT NULL,
  tipo_midia  TEXT        NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
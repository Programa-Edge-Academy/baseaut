-- 20260501_000022_create_secoes_relatorio.sql
CREATE TABLE public.secoes_relatorio (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID    NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  titulo       TEXT    NOT NULL,
  conteudo     TEXT,
  ordem        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (relatorio_id, ordem)
);
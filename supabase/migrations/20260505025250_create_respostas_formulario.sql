-- 20260501_000020_create_respostas_formulario.sql
CREATE TABLE public.respostas_formulario (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id        UUID        NOT NULL REFERENCES public.sessoes(id)    ON DELETE CASCADE,
  pergunta_id      UUID        NOT NULL REFERENCES public.perguntas(id)  ON DELETE RESTRICT,
  valor_preenchido TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, pergunta_id)
);
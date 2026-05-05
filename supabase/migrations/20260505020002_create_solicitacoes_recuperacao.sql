-- 20260501_000006_create_solicitacoes_recuperacao.sql
CREATE TABLE public.solicitacoes_recuperacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  codigo_hash TEXT NOT NULL,
  canal canal_recuperacao NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  validada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
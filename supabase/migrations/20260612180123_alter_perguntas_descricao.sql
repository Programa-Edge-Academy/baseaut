ALTER TABLE public.perguntas
  ADD COLUMN IF NOT EXISTS descricao TEXT;

COMMENT ON COLUMN public.perguntas.descricao IS 'Descrição detalhada ou instruções da pergunta. Suporta formatação em Markdown.';
-- ════════════════════════════════════════════════════════════════════
-- Feedbacks dos usuários para a equipe de desenvolvimento
-- ════════════════════════════════════════════════════════════════════
-- Canal in-app onde qualquer usuário autenticado (coordenador ou monitor)
-- envia problemas/sugestões. O conteúdo é privado: a RLS permite apenas o
-- INSERT do próprio usuário e NENHUM SELECT pelo cliente, então nada aparece
-- no app para os demais usuários. A equipe lê os registros pelo painel do
-- Supabase (service role / Table Editor, que ignoram RLS).
-- ════════════════════════════════════════════════════════════════════

-- Categoria do feedback enviado.
CREATE TYPE categoria_feedback AS ENUM ('problema', 'sugestao', 'outro');

CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  categoria categoria_feedback NOT NULL,
  mensagem TEXT NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 1 AND 2000),
  -- Hoje sempre 'android' (única plataforma disponível); coluna reservada para
  -- um desejável futuro (iOS/web).
  plataforma TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_created_at ON public.feedbacks (created_at DESC);
CREATE INDEX idx_feedbacks_usuario_id ON public.feedbacks (usuario_id);

-- ── RLS: só INSERT do próprio usuário; sem SELECT/UPDATE/DELETE ──────────────
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedbacks: insert own"
  ON public.feedbacks
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- ── Anti-spam: no máximo 10 feedbacks por usuário por hora ───────────────────
CREATE OR REPLACE FUNCTION public.limitar_feedbacks_por_hora()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.feedbacks
    WHERE usuario_id = NEW.usuario_id
      AND created_at > now() - INTERVAL '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'Limite de feedbacks por hora atingido. Tente novamente mais tarde.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_limitar_feedbacks_por_hora
  BEFORE INSERT ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.limitar_feedbacks_por_hora();

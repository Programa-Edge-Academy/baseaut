-- ════════════════════════════════════════════════════════════════════
-- Progresso do tutorial por usuário (persistido no banco)
-- ════════════════════════════════════════════════════════════════════
-- Guarda os módulos concluídos e a preferência de exibir/ocultar o botão de
-- tutorial no cabeçalho, para que o estado siga o usuário entre dispositivos.
-- preferencias_usuario já possui a policy self-access ("preferencias: own").
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.preferencias_usuario
  ADD COLUMN IF NOT EXISTS tutorial_modulos_concluidos TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tutorial_oculto BOOLEAN NOT NULL DEFAULT false;

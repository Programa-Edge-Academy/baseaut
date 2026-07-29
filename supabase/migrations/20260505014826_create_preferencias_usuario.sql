-- 20260501_000002_create_preferencias_usuario.sql
CREATE TABLE public.preferencias_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  modo_formulario_padrao modo_formulario NOT NULL DEFAULT 'ao_final',
  modo_sessao_padrao TEXT NOT NULL DEFAULT 'padrao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
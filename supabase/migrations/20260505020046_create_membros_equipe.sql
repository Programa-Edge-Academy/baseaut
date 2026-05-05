-- 20260501_000008_create_membros_equipe.sql
CREATE TABLE public.membros_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipe_id UUID NOT NULL REFERENCES public.equipes (id) ON DELETE CASCADE,
  papel tipo_perfil NOT NULL,
  status status_membro NOT NULL DEFAULT 'ativo',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, equipe_id)
);
-- Criação do ENUM tipo_formulario para categorizar os tipos de formulários
CREATE TYPE public.tipo_formulario AS ENUM ('anamnese', 'acompanhamento', 'avaliacao', 'outro');

-- 20260501_000012_create_formularios.sql
CREATE TABLE public.formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo tipo_formulario NOT NULL DEFAULT 'anamnese',
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
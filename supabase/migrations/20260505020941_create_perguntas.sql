-- Criação do ENUM de respostas
CREATE TYPE public.tipo_resposta_formulario AS ENUM ('texto_curto', 'texto_longo', 'multipla_escolha', 'selecao_unica', 'escala_likert', 'booleano');

-- 20260501_000013_create_perguntas.sql
CREATE TABLE public.perguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  texto_pergunta TEXT NOT NULL,
  tipo_resposta tipo_resposta_formulario NOT NULL,
  opcoes JSONB,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0
);
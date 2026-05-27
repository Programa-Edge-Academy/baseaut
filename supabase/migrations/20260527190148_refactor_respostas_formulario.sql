-- 1. Tornar sessao_id nullable
ALTER TABLE public.respostas_formulario
  ALTER COLUMN sessao_id DROP NOT NULL;

-- 2. Adicionar colunas
ALTER TABLE public.respostas_formulario
  ADD COLUMN aluno_id      UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD COLUMN formulario_id UUID NOT NULL REFERENCES public.formularios(id),
  ADD COLUMN atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Garantir que ao menos um vínculo existe
ALTER TABLE public.respostas_formulario
  ADD CONSTRAINT respostas_vinculo_obrigatorio
  CHECK (sessao_id IS NOT NULL OR aluno_id IS NOT NULL);
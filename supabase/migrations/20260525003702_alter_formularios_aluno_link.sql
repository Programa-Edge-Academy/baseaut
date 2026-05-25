-- 1. Relacionamento com alunos (nullable → formulário pode ser modelo genérico)
--    ON DELETE CASCADE: ao remover o aluno, seus formulários vinculados são apagados.
ALTER TABLE public.formularios
  ADD COLUMN aluno_id UUID
    REFERENCES public.alunos(id)
    ON DELETE CASCADE;
 
-- 2. Flag de proteção contra edições nas perguntas estruturadas.
--    Padrão FALSE para não impactar registros existentes.
ALTER TABLE public.formularios
  ADD COLUMN protegido BOOLEAN NOT NULL DEFAULT TRUE;
 
-- 3. Índice único condicional:
--    Impede duplicatas do mesmo tipo de formulário para um mesmo aluno.
--    A condição "WHERE aluno_id IS NOT NULL" exclui os modelos genéricos
--    (aluno_id NULL), que podem coexistir livremente por tipo.
CREATE UNIQUE INDEX uq_formularios_aluno_tipo
  ON public.formularios (aluno_id, tipo)
  WHERE aluno_id IS NOT NULL;

-- ==============================================================================
-- HOTFIX SEGURO: Saneamento exclusivo da tabela de formulários
-- ==============================================================================

BEGIN;

-- Atualiza apenas os metadados da instância:
-- -> Altera protegido para FALSE (destrava o RLS e corrige a regra de negócio)
-- -> Injeta o template_origem_id amarrando ao Template Pai correspondente
UPDATE public.formularios f
SET 
    protegido = FALSE,
    template_origem_id = t.id,
    updated_at = NOW()
FROM public.formularios t
WHERE f.aluno_id IS NOT NULL 
  AND f.protegido = TRUE
  AND t.tipo = f.tipo 
  AND t.protegido = TRUE 
  AND t.aluno_id IS NULL;

-- Remapeia as respostas antigas para apontarem para as perguntas do Template Global
UPDATE public.respostas_formulario rf
SET pergunta_id = p_global.id
FROM public.perguntas p_clonada
JOIN public.formularios f_instancia ON f_instancia.id = p_clonada.formulario_id
JOIN public.perguntas p_global ON p_global.formulario_id = f_instancia.template_origem_id 
                              AND p_global.ordem = p_clonada.ordem
WHERE rf.pergunta_id = p_clonada.id
  AND f_instancia.aluno_id IS NOT NULL 
  AND f_instancia.template_origem_id IS NOT NULL;

COMMIT;


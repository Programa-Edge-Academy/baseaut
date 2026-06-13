CREATE OR REPLACE FUNCTION public.rpc_check_pendencia_aluno(p_aluno_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    
    -- Tem algum exercício de qualquer sessão sem avaliação?
    SELECT 1
    FROM public.sessoes s
    JOIN public.execucoes_exercicio ex ON ex.sessao_id = s.id
    WHERE s.aluno_id = p_aluno_id
      AND ex.status_realizacao IS DISTINCT FROM 'nao_realizada'
      AND (ex.nivel_desenvolvimento IS NULL OR ex.registro_ajuda IS NULL)
      
    UNION ALL
    
    -- Tem alguma pergunta obrigatória de qualquer sessão sem resposta?
    SELECT 1
    FROM public.sessoes s
    JOIN public.perguntas p ON p.formulario_id = s.formulario_id
    LEFT JOIN public.respostas_formulario rf 
           ON rf.pergunta_id = p.id AND rf.sessao_id = s.id
    WHERE s.aluno_id = p_aluno_id
      AND p.obrigatoria = true
      AND rf.id IS NULL
      
  );
END;
$$;
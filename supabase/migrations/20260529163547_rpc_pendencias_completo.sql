CREATE OR REPLACE FUNCTION public.verificar_pendencias_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
AS $$
DECLARE
  v_exercicios_pendentes JSONB;
  v_perguntas_pendentes JSONB;
  v_resultado JSONB;
BEGIN
  -- 1. Levantar Exercícios Pendentes (Ajustado com itens_circuito e status_realizacao)
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object(
             'exercicio_id', ic.exercicio_id
           )
         ), '[]'::jsonb)
  INTO v_exercicios_pendentes
  FROM public.sessoes s
  JOIN public.itens_circuito ic ON ic.circuito_id = s.circuito_id
  LEFT JOIN public.execucoes_exercicio ex 
         ON ex.exercicio_id = ic.exercicio_id 
        AND ex.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    AND (ex.id IS NULL OR ex.status_realizacao = 'nao_realizada');

  -- 2. Levantar Perguntas Obrigatórias sem Resposta
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object(
             'pergunta_id', p.id,
             'ordem', p.ordem
           )
         ), '[]'::jsonb)
  INTO v_perguntas_pendentes
  FROM public.sessoes s
  JOIN public.formularios f ON f.id = s.formulario_id 
  JOIN public.perguntas p ON p.formulario_id = f.id
  -- CORREÇÃO AQUI: A tabela correta no banco é respostas_formulario
  LEFT JOIN public.respostas_formulario rf 
         ON rf.pergunta_id = p.id 
        AND rf.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    AND p.obrigatoria = true
    AND rf.id IS NULL; -- Identifica que o avaliador não respondeu

  -- 3. Consolidação do Retorno em JSONB
  v_resultado := jsonb_build_object(
    'tem_pendencias', (jsonb_array_length(v_exercicios_pendentes) > 0 OR jsonb_array_length(v_perguntas_pendentes) > 0),
    'exercicios_pendentes', v_exercicios_pendentes,
    'perguntas_pendentes', v_perguntas_pendentes
  );

  RETURN v_resultado;
END;
$$;
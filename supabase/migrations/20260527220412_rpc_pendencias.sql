CREATE OR REPLACE FUNCTION public.verificar_pendencias_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exercicios_pendentes JSONB;
  v_perguntas_pendentes JSONB;
  v_resultado JSONB;
BEGIN
  -- 1. Levantar Exercícios Pendentes
  -- Mapeia os exercícios pertencentes ao circuito da sessão que não possuem execução,
  -- ou que foram marcados com o status 'nao_realizada'.
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object(
             'exercicio_id', ec.exercicio_id
             -- Se precisar do nome para a interface, basta fazer um JOIN com public.exercicios
           )
         ), '[]'::jsonb)
  INTO v_exercicios_pendentes
  FROM public.sessoes s
  JOIN public.circuitos_exercicios ec ON ec.circuito_id = s.circuito_id
  LEFT JOIN public.execucoes_exercicio ex 
         ON ex.exercicio_id = ec.exercicio_id 
        AND ex.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    AND (ex.id IS NULL OR ex.status = 'nao_realizada');

  -- 2. Levantar Perguntas Obrigatórias sem Resposta
  -- Cruza o formulário de Registro de Controle (RC) da sessão com as respostas registradas.
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
  LEFT JOIN public.respostas r 
         ON r.pergunta_id = p.id 
        AND r.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    AND p.obrigatoria = true
    AND r.id IS NULL; -- Identifica que o avaliador não respondeu

  -- 3. Consolidação do Retorno em JSONB
  v_resultado := jsonb_build_object(
    'tem_pendencias', (jsonb_array_length(v_exercicios_pendentes) > 0 OR jsonb_array_length(v_perguntas_pendentes) > 0),
    'exercicios_pendentes', v_exercicios_pendentes,
    'perguntas_pendentes', v_perguntas_pendentes
  );

  RETURN v_resultado;
END;
$$;
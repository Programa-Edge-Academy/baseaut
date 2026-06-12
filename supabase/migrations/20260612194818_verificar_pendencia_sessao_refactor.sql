CREATE OR REPLACE FUNCTION public.verificar_pendencias_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_exercicios_pendentes JSONB;
  v_perguntas_pendentes JSONB;
  v_resultado JSONB;
BEGIN

  -- 1. Levantar Exercícios Pendentes ("Adiar resposta")
  -- O exercício foi iniciado, não foi marcado como "não realizada", mas falta avaliação.
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('exercicio_id', ex.exercicio_id)
         ), '[]'::jsonb)
  INTO v_exercicios_pendentes
  FROM public.execucoes_exercicio ex
  WHERE ex.sessao_id = p_sessao_id
    AND ex.status_realizacao IS DISTINCT FROM 'nao_realizada'
    AND (ex.nivel_desenvolvimento IS NULL OR ex.registro_ajuda IS NULL);

  -- 2. Levantar Perguntas Obrigatórias sem Resposta (RC da Sessão)
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('pergunta_id', p.id, 'ordem', p.ordem)
         ), '[]'::jsonb)
  INTO v_perguntas_pendentes
  FROM public.sessoes s
  JOIN public.perguntas p ON p.formulario_id = s.formulario_id
  LEFT JOIN public.respostas_formulario rf 
         ON rf.pergunta_id = p.id AND rf.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    AND p.obrigatoria = true
    AND rf.id IS NULL;

  -- 3. Consolidação
  v_resultado := jsonb_build_object(
    'tem_pendencias', (jsonb_array_length(v_exercicios_pendentes) > 0 OR jsonb_array_length(v_perguntas_pendentes) > 0),
    'exercicios_pendentes', v_exercicios_pendentes,
    'perguntas_pendentes', v_perguntas_pendentes
  );

  RETURN v_resultado;
END;
$$;
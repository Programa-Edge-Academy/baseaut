CREATE OR REPLACE FUNCTION public.rpc_get_progresso_sessoes_aluno(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_resultado JSONB;
BEGIN

  WITH previstos AS (
    -- Conta quantos exercícios existiam no circuito agendado para a sessão
    SELECT s.id AS sessao_id, COUNT(ic.exercicio_id) AS total
    FROM public.sessoes s
    LEFT JOIN public.itens_circuito ic ON ic.circuito_id = s.circuito_id
    WHERE s.aluno_id = p_aluno_id
    GROUP BY s.id
  ),
  realizados AS (
    -- Conta quantas execuções ocorreram que não foram puladas/recusadas
    SELECT ex.sessao_id, COUNT(ex.id) AS total
    FROM public.execucoes_exercicio ex
    INNER JOIN public.sessoes s ON s.id = ex.sessao_id
    WHERE s.aluno_id = p_aluno_id
      AND ex.status_realizacao IS DISTINCT FROM 'nao_realizada'
    GROUP BY ex.sessao_id
  )
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'sessao_id', s.id,
      'numero', s.numero_sessao,
      'data_sessao', COALESCE(s.data_inicio, s.data_agendada),
      'total_previsto', COALESCE(p.total, 0),
      'total_realizado', COALESCE(r.total, 0)
    ) ORDER BY s.numero_sessao DESC
  ), '[]'::jsonb)
  INTO v_resultado
  FROM public.sessoes s
  LEFT JOIN previstos p ON p.sessao_id = s.id
  LEFT JOIN realizados r ON r.sessao_id = s.id
  WHERE s.aluno_id = p_aluno_id;

  RETURN v_resultado;

END;
$$;
-- Create function rpc_get_historico_geral
CREATE OR REPLACE FUNCTION public.rpc_get_historico_geral(
  p_equipe_id UUID,
  p_nome_aluno TEXT DEFAULT NULL,
  p_data DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(sub.aluno_data),
    '[]'::jsonb
  )
  INTO v_resultado
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'nome_completo', a.nome_completo,
      'avatar_url', a.avatar_url,
      'tem_pendencia', COALESCE(
        EXISTS (
          SELECT 1
          FROM public.vw_linha_do_tempo_aluno v
          WHERE v.aluno_id = a.id
            AND v.status_evento ILIKE '%pendente%'
            AND (p_data IS NULL OR v.data_evento::date = p_data)
        ),
        false
      ),
      'total_eventos', COALESCE(
        (
          SELECT COUNT(*)
          FROM public.vw_linha_do_tempo_aluno v
          WHERE v.aluno_id = a.id
            AND (p_data IS NULL OR v.data_evento::date = p_data)
        ),
        0
      ),
      'ultimo_evento', (
        SELECT to_jsonb(v) || jsonb_build_object(
          'tem_pendencia', COALESCE(v.status_evento ILIKE '%pendente%', false)
        )
        FROM public.vw_linha_do_tempo_aluno v
        WHERE v.aluno_id = a.id
          AND (p_data IS NULL OR v.data_evento::date = p_data)
        ORDER BY v.data_evento DESC
        LIMIT 1
      )
    ) AS aluno_data
    FROM public.alunos a
    WHERE a.equipe_id = p_equipe_id
      AND a.ativo = true
      AND (p_nome_aluno IS NULL OR p_nome_aluno = '' OR a.nome_completo ILIKE '%' || p_nome_aluno || '%')
    ORDER BY a.nome_completo ASC
  ) sub;

  RETURN v_resultado;
END;
$$;

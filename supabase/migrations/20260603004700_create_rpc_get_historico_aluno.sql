-- Create function rpc_get_historico_aluno
CREATE OR REPLACE FUNCTION public.rpc_get_historico_aluno(
  p_aluno_id UUID,
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
  v_equipe_id UUID;
BEGIN
-- 1. Identifica a equipe da criança
SELECT equipe_id INTO v_equipe_id
FROM public.alunos
WHERE id = p_aluno_id;

IF v_equipe_id IS NULL THEN
  RAISE EXCEPTION 'Aluno não encontrado.';
END IF;

-- 2. Validação de Segurança Multitenant
IF NOT public.is_team_member(v_equipe_id) THEN
  RAISE EXCEPTION 'Acesso negado: Você não tem permissão para visualizar o histórico deste aluno.';
END IF;

-- 3. Query original mantida intacta
SELECT COALESCE(
    jsonb_agg(
      to_jsonb(v) || jsonb_build_object(
        'tem_pendencia', COALESCE(v.status_evento ILIKE '%pendente%', false)
      )
      ORDER BY v.data_evento DESC
    ),
    '[]'::jsonb
  )
  INTO v_resultado
  FROM public.vw_linha_do_tempo_aluno v
  WHERE v.aluno_id = p_aluno_id
    AND (p_data IS NULL OR v.data_evento::date = p_data);

  RETURN v_resultado;
END;
$$;

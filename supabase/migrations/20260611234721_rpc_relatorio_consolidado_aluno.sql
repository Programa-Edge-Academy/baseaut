CREATE OR REPLACE FUNCTION public.rpc_get_relatorio_consolidado_aluno(
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipe_id UUID;
  v_resultado JSONB;
BEGIN

  -- 1. Validação inicial e Segurança
  SELECT equipe_id INTO v_equipe_id FROM public.alunos WHERE id = p_aluno_id;
  
  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não possui permissão para visualizar os dados deste aluno.';
  END IF;

  -- 2. Processamento em Lote (Single-Scan Equivalents)
  WITH
    -- Perfil do Aluno (Cast para INT na idade)
    perfil AS (
      SELECT
        nome_completo,
        data_nascimento,
        EXTRACT(YEAR FROM age(CURRENT_DATE, data_nascimento))::INT AS idade,
        altura,
        peso,
        cintura,
        nivel_suporte,
        diagnostico_detalhado,
        observacoes_clinicas
      FROM public.alunos
      WHERE id = p_aluno_id
    ),

    -- Agrupamento Massivo de Respostas do Registro de Controle
    respostas_rc AS (
      SELECT
        rf.sessao_id,
        jsonb_agg(
          jsonb_build_object(
            'pergunta', p.texto_pergunta,
            'valor',    rf.valor_preenchido
          ) ORDER BY p.ordem
        ) AS respostas_json
      FROM public.respostas_formulario rf
      INNER JOIN public.perguntas p ON p.id = rf.pergunta_id
      WHERE rf.aluno_id = p_aluno_id
      GROUP BY rf.sessao_id
    ),

    -- Sessões Formatadas com suas Respostas
    sessoes_rc AS (
      SELECT
        s.id,
        COALESCE(s.data_inicio, s.data_agendada) AS data_sessao,
        m.nome_completo AS monitor,
        COALESCE(rrc.respostas_json, '[]'::jsonb) AS respostas
      FROM public.sessoes s
      INNER JOIN public.formularios f ON f.id = s.formulario_id
      LEFT JOIN public.profiles m ON m.id = s.monitor_id
      LEFT JOIN respostas_rc rrc ON rrc.sessao_id = s.id
      WHERE s.aluno_id = p_aluno_id
        AND f.tipo = 'registro_controle'
        AND f.protegido = FALSE
      ORDER BY COALESCE(s.data_inicio, s.data_agendada) DESC
    ),

    -- Soma Massiva das Pontuações de Protocolos (Evita Null e faz Cast)
    pontuacoes_form AS (
      SELECT
        formulario_id,
        COALESCE(SUM(valor_preenchido::NUMERIC), 0)::INT AS pontuacao_total
      FROM public.respostas_formulario
      WHERE aluno_id = p_aluno_id
      GROUP BY formulario_id
    )

  -- 3. Montagem do Payload Final
  SELECT jsonb_build_object(
    
    'perfil_aluno', (
      SELECT to_jsonb(p.*) FROM perfil p
    ),
    
    'registros_controle', COALESCE((
      SELECT jsonb_agg(to_jsonb(src.*)) FROM sessoes_rc src
    ), '[]'::jsonb),
    
    'historico_cars', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao',   pf.pontuacao_total
        ) ORDER BY COALESCE(f.data_avaliacao, f.created_at::DATE) DESC
      )
      FROM public.formularios f
      LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
      LEFT JOIN pontuacoes_form pf ON pf.formulario_id = f.id
      WHERE f.aluno_id = p_aluno_id 
        AND f.tipo = 'cars' 
        AND f.protegido = FALSE
    ), '[]'::jsonb),
    
    'historico_ata', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao',   pf.pontuacao_total
        ) ORDER BY COALESCE(f.data_avaliacao, f.created_at::DATE) DESC
      )
      FROM public.formularios f
      LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
      LEFT JOIN pontuacoes_form pf ON pf.formulario_id = f.id
      WHERE f.aluno_id = p_aluno_id 
        AND f.tipo = 'ata' 
        AND f.protegido = FALSE
    ), '[]'::jsonb),
    
    'historico_mabc2', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao',   COALESCE(f.metadados->>'escore_total', f.metadados->>'escore_total_teste'),
          'percentil',   f.metadados->>'percentil'
        ) ORDER BY COALESCE(f.data_avaliacao, f.created_at::DATE) DESC
      )
      FROM public.formularios f
      LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
      WHERE f.aluno_id = p_aluno_id 
        AND f.tipo = 'mabc2' 
        AND f.protegido = FALSE
    ), '[]'::jsonb)

  ) INTO v_resultado;

  RETURN v_resultado;

END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_relatorio_consolidado_aluno(UUID) TO authenticated;

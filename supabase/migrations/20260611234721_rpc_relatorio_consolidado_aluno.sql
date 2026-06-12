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

  -- Validação inicial e resolução de equipe_id
  SELECT equipe_id INTO v_equipe_id FROM public.alunos WHERE id = p_aluno_id;
  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Aluno % não encontrado.', p_aluno_id;
  END IF;

  -- Verificação de acesso
  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: usuário % não possui permissão para este aluno.', auth.uid();
  END IF;

  -- PASSO 1: Cabeçalho/Perfil
  -- Campos: nome, data_nascimento, idade, altura, peso, cintura, nível de suporte, diagnóstico e observações clínicas.
  -- PASSO 2: Registros de Controle (RC)
  -- Campos: data da sessão, nome do monitor e respostas individuais.
  SELECT jsonb_build_object(
    'perfil_aluno', (
      SELECT jsonb_build_object(
        'nome_completo',         a.nome_completo,
        'data_nascimento',       a.data_nascimento,
        'idade',                 EXTRACT(YEAR FROM age(CURRENT_DATE, a.data_nascimento)),
        'altura',                a.altura,
        'peso',                  a.peso,
        'cintura',               a.cintura,
        'nivel_suporte',         a.nivel_suporte,
        'diagnostico_detalhado', a.diagnostico_detalhado,
        'observacoes_clinicas',  a.observacoes_clinicas
      )
      FROM public.alunos a
      WHERE a.id = p_aluno_id
    ),
    'registros_controle', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          s.id,
          'data_sessao', COALESCE(s.data_inicio, s.data_agendada),
          'monitor',     m.nome_completo,
          'respostas', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'pergunta', p.texto_pergunta,
                'valor',    rf.valor_preenchido
              )
              ORDER BY p.ordem
            )
            FROM public.respostas_formulario rf
            INNER JOIN public.perguntas p ON p.id = rf.pergunta_id
            WHERE rf.formulario_id = s.formulario_id
              AND rf.aluno_id = p_aluno_id
              AND rf.sessao_id = s.id
          )
        )
        ORDER BY s.data_inicio DESC
      )
      FROM public.sessoes s
      INNER JOIN public.formularios f ON f.id = s.formulario_id
      LEFT JOIN public.profiles m ON m.id = s.monitor_id
      WHERE s.aluno_id = p_aluno_id
        AND f.tipo = 'registro_controle'
        AND f.protegido = FALSE
    ), '[]'::jsonb),

    -- PASSO 3: Bateria de Protocolos (Arrays distintos no nó raiz)
    -- PASSO 4: Filtro de Exportação (protegido = FALSE)
    
    -- Histórico CARS
    'historico_cars', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao', (
            SELECT SUM(rf.valor_preenchido::NUMERIC)
            FROM public.respostas_formulario rf
            WHERE rf.formulario_id = f.id
          )
        )
        ORDER BY f.data_avaliacao DESC, f.created_at DESC
      )
      FROM public.formularios f
      LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
      WHERE f.aluno_id = p_aluno_id
        AND f.tipo = 'cars'
        AND f.protegido = FALSE
    ), '[]'::jsonb),

    -- Histórico ATA
    'historico_ata', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao', (
            SELECT SUM(rf.valor_preenchido::NUMERIC)
            FROM public.respostas_formulario rf
            WHERE rf.formulario_id = f.id
          )
        )
        ORDER BY f.data_avaliacao DESC, f.created_at DESC
      )
      FROM public.formularios f
      LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
      WHERE f.aluno_id = p_aluno_id
        AND f.tipo = 'ata'
        AND f.protegido = FALSE
    ), '[]'::jsonb),

    -- Histórico MABC-2
    'historico_mabc2', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',          f.id,
          'data',        COALESCE(f.data_avaliacao, f.created_at::DATE),
          'responsavel', pr.nome_completo,
          'pontuacao',   COALESCE(f.metadados->>'escore_total', f.metadados->>'escore_total_teste'),
          'percentil',   f.metadados->>'percentil'
        )
        ORDER BY f.data_avaliacao DESC, f.created_at DESC
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

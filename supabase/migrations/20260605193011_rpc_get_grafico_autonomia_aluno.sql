CREATE OR REPLACE FUNCTION public.rpc_get_grafico_autonomia_aluno(p_aluno_id    UUID, p_data_inicio TIMESTAMPTZ, p_data_fim    TIMESTAMPTZ)
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
  -- 1. Validar existência do aluno e obter equipe
  SELECT equipe_id INTO v_equipe_id
  FROM public.alunos
  WHERE id = p_aluno_id;

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado ou sem equipe vinculada.';
  END IF;

  -- 2. Trava de segurança: verifica se o usuário tem acesso à equipe do aluno
  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não tem permissão para visualizar os dados deste aluno.';
  END IF;

  -- 3. Montagem do payload via CTEs
  WITH

    -- CTE principal: agrega os registros de ajuda por sessão concluída
    node_sessoes AS (
      SELECT
        s.id                                                          AS sessao_id,
        s.data_inicio                                                 AS data_inicio,
        COUNT(ee.id) FILTER (WHERE ee.registro_ajuda = 'ajuda_intrusiva') AS ajuda_intrusiva,
        COUNT(ee.id) FILTER (WHERE ee.registro_ajuda = 'autonomo')         AS autonomo
      FROM public.sessoes s
      LEFT JOIN public.execucoes_exercicio ee
        ON ee.sessao_id = s.id
      WHERE s.aluno_id  = p_aluno_id
        AND s.status    = 'concluida'
        AND s.data_inicio >= p_data_inicio
        AND s.data_inicio <= p_data_fim
      GROUP BY s.id, s.data_inicio
      ORDER BY s.data_inicio ASC
    ),

    -- CTE de totais: soma todos os valores do período
    node_totais AS (
      SELECT
        COALESCE(SUM(ajuda_intrusiva), 0) AS total_ajuda_intrusiva,
        COALESCE(SUM(autonomo), 0)         AS total_autonomo
      FROM node_sessoes
    )

  SELECT
    jsonb_build_object(
      'sessoes', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'sessao_id',       ns.sessao_id,
              'data_inicio',     ns.data_inicio,
              'ajuda_intrusiva', ns.ajuda_intrusiva,
              'autonomo',        ns.autonomo
            )
            ORDER BY ns.data_inicio ASC
          )
          FROM node_sessoes ns
        ),
        '[]'::jsonb
      ),
      'totais', (
        SELECT jsonb_build_object(
          'ajuda_intrusiva', nt.total_ajuda_intrusiva,
          'autonomo',        nt.total_autonomo
        )
        FROM node_totais nt
      ),
      'texto_explicativo',
        'A redução de Ajuda Intrusiva e o aumento de registros Autônomos indicam evolução na autonomia do aluno.'
    )
  INTO v_resultado;

  RETURN v_resultado;
END;
$$;

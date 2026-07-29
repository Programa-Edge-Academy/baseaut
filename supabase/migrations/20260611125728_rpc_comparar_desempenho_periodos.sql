-- =============================================================================
-- US10.5 – US10.5.5 | God Query de Comparação de Desempenho (P1 vs P2)
-- RPC: rpc_comparar_desempenho_periodos
--
-- Parâmetros:
--   p_aluno_id   UUID          – aluno alvo
--   p_p1_inicio  TIMESTAMPTZ   – início do Período 1
--   p_p1_fim     TIMESTAMPTZ   – fim do Período 1
--   p_p2_inicio  TIMESTAMPTZ   – início do Período 2
--   p_p2_fim     TIMESTAMPTZ   – fim do Período 2
--
-- Retorno: JSONB unificado com os nós:
--   resumo         → volumetria de sessões e variação percentual (Passo 2)
--   ajuda          → distribuição de registro_ajuda e variação percentual (Passo 2)
--   exercicios     → último nível por exercício e variação numérica (Passo 3)
--   comportamentos → contagem absoluta por tipo nos dois períodos (Passo 4)
--
-- NOTA: P1 e P2 são tratados como flags booleanas independentes 
-- (is_p1 / is_p2), e não como um CASE excludente. Isso permite
-- que os períodos se sobreponham (ex: P1 = ano inteiro, P2 = mês atual)
-- sem que uma sessão "perca" sua contagem em um dos lados.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_comparar_desempenho_periodos(
  p_aluno_id  UUID,
  p_p1_inicio TIMESTAMPTZ,
  p_p1_fim    TIMESTAMPTZ,
  p_p2_inicio TIMESTAMPTZ,
  p_p2_fim    TIMESTAMPTZ
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

  -- =========================================================================
  -- PASSO 1 – Trava de Segurança
  -- Obtém equipe_id do aluno e valida acesso com can_access_team(),
  -- que cobre tanto membros ativos quanto o coordenador responsável.
  -- =========================================================================

  SELECT equipe_id
    INTO v_equipe_id
    FROM public.alunos
   WHERE id = p_aluno_id;

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado ou sem equipe vinculada.';
  END IF;

  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não tem permissão para visualizar os dados deste aluno.';
  END IF;

  -- =========================================================================
  -- PASSO 2-4 – Single-Scan: todas as execuções e comportamentos dos dois
  -- períodos são varridos uma única vez dentro das CTEs base e depois
  -- pivotados com FILTER para eliminar passagens duplas na tabela.
  -- =========================================================================

  WITH

    -- -----------------------------------------------------------------------
    -- BASE: Sessões concluídas do aluno nos dois períodos.
    -- Flags booleanas independentes (is_p1 / is_p2) permitem sobreposição
    -- entre os períodos sem perda de contagem em nenhum dos lados.
    -- -----------------------------------------------------------------------
    sessoes_periodos AS (
      SELECT
        s.id        AS sessao_id,
        s.data_inicio,
        (s.data_inicio BETWEEN p_p1_inicio AND p_p1_fim) AS is_p1,
        (s.data_inicio BETWEEN p_p2_inicio AND p_p2_fim) AS is_p2
      FROM public.sessoes s
      WHERE s.aluno_id  = p_aluno_id
        AND s.status    = 'concluida'
        AND (
              s.data_inicio BETWEEN p_p1_inicio AND p_p1_fim
           OR s.data_inicio BETWEEN p_p2_inicio AND p_p2_fim
        )
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 2A – Resumo volumétrico de sessões (Single-Scan).
    -- -----------------------------------------------------------------------
    resumo_sessoes AS (
      SELECT
        COUNT(*) FILTER (WHERE is_p1) AS total_p1,
        COUNT(*) FILTER (WHERE is_p2) AS total_p2
      FROM sessoes_periodos
    ),

    -- -----------------------------------------------------------------------
    -- BASE: Execuções das sessões identificadas acima (Single-Scan).
    -- Carrega os campos necessários para Passos 2B, 3 e 4 de uma vez.
    -- -----------------------------------------------------------------------
    execucoes_base AS (
      SELECT
        ee.exercicio_id,
        ee.nivel_desenvolvimento,
        ee.registro_ajuda,
        ee.created_at,
        sp.is_p1,
        sp.is_p2,
        sp.data_inicio
      FROM public.execucoes_exercicio ee
      INNER JOIN sessoes_periodos sp ON sp.sessao_id = ee.sessao_id
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 2B – Volumetria de ajuda por período (pivô em passo único).
    -- -----------------------------------------------------------------------
    resumo_ajuda AS (
      SELECT
        COUNT(*) FILTER (WHERE is_p1 AND registro_ajuda = 'autonomo'::registro_ajuda_enum)        AS autonomo_p1,
        COUNT(*) FILTER (WHERE is_p2 AND registro_ajuda = 'autonomo'::registro_ajuda_enum)        AS autonomo_p2,
        COUNT(*) FILTER (WHERE is_p1 AND registro_ajuda = 'ajuda_intrusiva'::registro_ajuda_enum) AS intrusiva_p1,
        COUNT(*) FILTER (WHERE is_p2 AND registro_ajuda = 'ajuda_intrusiva'::registro_ajuda_enum) AS intrusiva_p2
      FROM execucoes_base
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3A (P1) – Último nível de desenvolvimento por exercício em P1.
    -- Isolado em CTE própria para evitar conflito no DISTINCT ON quando
    -- os períodos se sobrepõem (uma mesma execução pode pertencer a P1 e P2
    -- simultaneamente).
    -- -----------------------------------------------------------------------
    nivel_p1 AS (
      SELECT DISTINCT ON (exercicio_id)
        exercicio_id,
        nivel_desenvolvimento::text AS nivel,
        CASE nivel_desenvolvimento
          WHEN 'inicial'       THEN 1
          WHEN 'intermediario' THEN 2
          WHEN 'maduro'        THEN 3
        END AS peso
      FROM execucoes_base
      WHERE is_p1 AND nivel_desenvolvimento IS NOT NULL
      ORDER BY exercicio_id, data_inicio DESC, created_at DESC
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3A (P2) – Último nível de desenvolvimento por exercício em P2.
    -- -----------------------------------------------------------------------
    nivel_p2 AS (
      SELECT DISTINCT ON (exercicio_id)
        exercicio_id,
        nivel_desenvolvimento::text AS nivel,
        CASE nivel_desenvolvimento
          WHEN 'inicial'       THEN 1
          WHEN 'intermediario' THEN 2
          WHEN 'maduro'        THEN 3
        END AS peso
      FROM execucoes_base
      WHERE is_p2 AND nivel_desenvolvimento IS NOT NULL
      ORDER BY exercicio_id, data_inicio DESC, created_at DESC
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3B – Pivota P1/P2 por exercício via FULL OUTER JOIN e enriquece
    -- com o título do exercício. COALESCE garante que exercícios presentes
    -- em apenas um dos períodos também apareçam no resultado.
    -- -----------------------------------------------------------------------
    exercicios_evolucao AS (
      SELECT
        COALESCE(p1.exercicio_id, p2.exercicio_id) AS exercicio_id,
        ex.titulo,
        p1.nivel AS nivel_p1,
        p2.nivel AS nivel_p2,
        p1.peso  AS peso_p1,
        p2.peso  AS peso_p2,
        (p2.peso - p1.peso) AS variacao_nivel
      FROM nivel_p1 p1
      FULL OUTER JOIN nivel_p2 p2 ON p1.exercicio_id = p2.exercicio_id
      INNER JOIN public.exercicios ex ON ex.id = COALESCE(p1.exercicio_id, p2.exercicio_id)
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 4 – Comportamentos (Single-Scan via JOIN com sessoes_periodos).
    -- Mantém apenas tipo + flags de período; a pivotagem por tipo é feita
    -- diretamente na montagem do JSONB final.
    -- -----------------------------------------------------------------------
    comportamentos_base AS (
      SELECT
        cs.tipo,
        sp.is_p1,
        sp.is_p2
      FROM public.comportamentos_sessao cs
      INNER JOIN sessoes_periodos sp ON sp.sessao_id = cs.sessao_id
    )

  -- ==========================================================================
  -- MONTAGEM DO JSONB FINAL
  -- Cada nó agrega os resultados dos CTEs correspondentes.
  -- ==========================================================================
  SELECT jsonb_build_object(

    -- -------------------------------------------------------------------------
    -- Nó: resumo | Passo 2 – volumetria de sessões + matemática anti-crash
    -- -------------------------------------------------------------------------
    'resumo', (
      SELECT jsonb_build_object(
        'sessoes_p1',              rs.total_p1,
        'sessoes_p2',              rs.total_p2,
        'diferenca_absoluta',      ABS(rs.total_p2 - rs.total_p1),
        'variacao_percentual',
          CASE
            -- P1=0 e P2=0 → 0%
            WHEN rs.total_p1 = 0 AND rs.total_p2 = 0  THEN 0.00
            -- P1=0 e P2>0 → +100%
            WHEN rs.total_p1 = 0 AND rs.total_p2 > 0  THEN 100.00
            -- Caso geral (blindado: total_p1 > 0)
            ELSE ROUND(
              ((rs.total_p2 - rs.total_p1)::NUMERIC / rs.total_p1::NUMERIC) * 100,
            2)
          END
      )
      FROM resumo_sessoes rs
    ),

    -- -------------------------------------------------------------------------
    -- Nó: ajuda | Passo 2 – variação de autonomo e ajuda_intrusiva
    -- -------------------------------------------------------------------------
    'ajuda', (
      SELECT jsonb_build_object(
        'autonomo', jsonb_build_object(
          'p1',                  ra.autonomo_p1,
          'p2',                  ra.autonomo_p2,
          'diferenca_absoluta',  ABS(ra.autonomo_p2 - ra.autonomo_p1),
          'variacao_percentual',
            CASE
              WHEN ra.autonomo_p1 = 0 AND ra.autonomo_p2 = 0  THEN 0.00
              WHEN ra.autonomo_p1 = 0 AND ra.autonomo_p2 > 0  THEN 100.00
              ELSE ROUND(
                ((ra.autonomo_p2 - ra.autonomo_p1)::NUMERIC / ra.autonomo_p1::NUMERIC) * 100,
              2)
            END
        ),
        'ajuda_intrusiva', jsonb_build_object(
          'p1',                  ra.intrusiva_p1,
          'p2',                  ra.intrusiva_p2,
          'diferenca_absoluta',  ABS(ra.intrusiva_p2 - ra.intrusiva_p1),
          'variacao_percentual',
            CASE
              WHEN ra.intrusiva_p1 = 0 AND ra.intrusiva_p2 = 0  THEN 0.00
              WHEN ra.intrusiva_p1 = 0 AND ra.intrusiva_p2 > 0  THEN 100.00
              ELSE ROUND(
                ((ra.intrusiva_p2 - ra.intrusiva_p1)::NUMERIC / ra.intrusiva_p1::NUMERIC) * 100,
              2)
            END
        )
      )
      FROM resumo_ajuda ra
    ),

    -- -------------------------------------------------------------------------
    -- Nó: exercicios | Passo 3 – evolução numérica por exercício
    -- -------------------------------------------------------------------------
    'exercicios', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'exercicio_id',   ee.exercicio_id,
            'titulo',         ee.titulo,
            'nivel_p1',       ee.nivel_p1,
            'nivel_p2',       ee.nivel_p2,
            'peso_p1',        ee.peso_p1,
            'peso_p2',        ee.peso_p2,
            'variacao_nivel', ee.variacao_nivel
          )
          ORDER BY ee.titulo
        )
        FROM exercicios_evolucao ee
      ),
      '[]'::jsonb
    ),

    -- -------------------------------------------------------------------------
    -- Nó: comportamentos | Passo 4 – volumetria absoluta por tipo
    -- Estrutura fixa (chaves conhecidas pelo dashboard), pivotada
    -- diretamente sobre comportamentos_base com FILTER (Single-Scan).
    -- -------------------------------------------------------------------------
    'comportamentos', (
      SELECT jsonb_build_object(
        'estereotipia', jsonb_build_object(
          'p1', COUNT(*) FILTER (WHERE is_p1 AND tipo = 'estereotipia'),
          'p2', COUNT(*) FILTER (WHERE is_p2 AND tipo = 'estereotipia'),
          'diferenca_absoluta', ABS(
            COUNT(*) FILTER (WHERE is_p2 AND tipo = 'estereotipia')
            - COUNT(*) FILTER (WHERE is_p1 AND tipo = 'estereotipia')
          )
        ),
        'contato_visual', jsonb_build_object(
          'p1', COUNT(*) FILTER (WHERE is_p1 AND tipo = 'contato_visual'),
          'p2', COUNT(*) FILTER (WHERE is_p2 AND tipo = 'contato_visual'),
          'diferenca_absoluta', ABS(
            COUNT(*) FILTER (WHERE is_p2 AND tipo = 'contato_visual')
            - COUNT(*) FILTER (WHERE is_p1 AND tipo = 'contato_visual')
          )
        ),
        'engajamento', jsonb_build_object(
          'p1', COUNT(*) FILTER (WHERE is_p1 AND tipo = 'engajamento'),
          'p2', COUNT(*) FILTER (WHERE is_p2 AND tipo = 'engajamento'),
          'diferenca_absoluta', ABS(
            COUNT(*) FILTER (WHERE is_p2 AND tipo = 'engajamento')
            - COUNT(*) FILTER (WHERE is_p1 AND tipo = 'engajamento')
          )
        ),
        'fuga', jsonb_build_object(
          'p1', COUNT(*) FILTER (WHERE is_p1 AND tipo = 'fuga'),
          'p2', COUNT(*) FILTER (WHERE is_p2 AND tipo = 'fuga'),
          'diferenca_absoluta', ABS(
            COUNT(*) FILTER (WHERE is_p2 AND tipo = 'fuga')
            - COUNT(*) FILTER (WHERE is_p1 AND tipo = 'fuga')
          )
        ),
        'crise', jsonb_build_object(
          'p1', COUNT(*) FILTER (WHERE is_p1 AND tipo = 'crise'),
          'p2', COUNT(*) FILTER (WHERE is_p2 AND tipo = 'crise'),
          'diferenca_absoluta', ABS(
            COUNT(*) FILTER (WHERE is_p2 AND tipo = 'crise')
            - COUNT(*) FILTER (WHERE is_p1 AND tipo = 'crise')
          )
        )
      )
      FROM comportamentos_base
    )

  ) INTO v_resultado;

  RETURN v_resultado;

END;
$$;

-- Permissão de execução para usuários autenticados via Supabase Auth
GRANT EXECUTE
  ON FUNCTION public.rpc_comparar_desempenho_periodos(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;
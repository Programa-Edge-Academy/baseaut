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
-- =============================================================================



-- =============================================================================
-- OTIMIZAÇÕES DE LEITURA / CUSTO
-- -----------------------------------------------------------------------------
-- As otimizações abaixo não alteram o contrato JSON, a regra de segurança,
-- a matemática anti-crash ou a lógica funcional da RPC.
--
-- O ganho esperado vem de alinhar os índices ao padrão real de acesso da função:
--   1. localizar rapidamente as sessões concluídas do aluno dentro dos períodos;
--   2. ler execuções por sessão cobrindo as colunas usadas em ajuda/evolução.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Sessões concluídas por aluno e período
-- -----------------------------------------------------------------------------
-- A RPC sempre filtra:
--   s.aluno_id = p_aluno_id
--   s.status = 'concluida'
--   s.data_inicio dentro de P1 ou P2
--
-- Este índice parcial reduz o volume lido para o subconjunto elegível da US:
-- apenas sessões concluídas. Isso reforça o critério de aceite de considerar
-- somente sessões concluídas nos cálculos de resumo, ajuda, exercícios e
-- comportamentos.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sessoes_comparativo_aluno_concluida_data
  ON public.sessoes (aluno_id, data_inicio DESC, id)
  WHERE status = 'concluida';

-- -----------------------------------------------------------------------------
-- 2) Execuções por sessão com cobertura das colunas usadas pela RPC
-- -----------------------------------------------------------------------------
-- A RPC junta execucoes_exercicio por sessao_id e lê, no mesmo fluxo:
--   - exercicio_id              -> agrupamento/evolução por exercício
--   - created_at                -> desempate cronológico do último nível
--   - nivel_desenvolvimento     -> Passo 3
--   - registro_ajuda            -> Passo 2 / ajuda
--
-- O índice abaixo reduz leituras de heap no caminho crítico da comparação,
-- mantendo a lógica single-scan e sem criar consultas separadas para P1/P2.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_execucoes_comparativo_sessao_exercicio_created
  ON public.execucoes_exercicio (sessao_id, exercicio_id, created_at DESC)
  INCLUDE (nivel_desenvolvimento, registro_ajuda);

-- -----------------------------------------------------------------------------
-- Não foi criado novo índice para comportamentos_sessao.
-- Motivo: o schema já possui índice por (sessao_id, tipo), que atende ao JOIN por
-- sessao_id e à agregação por tipo usada no Passo 4.
-- -----------------------------------------------------------------------------

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
    -- Classificadas com o flag periodo (1 ou 2) para pivô posterior.
    -- -----------------------------------------------------------------------
    sessoes_periodos AS (
      SELECT
        s.id                AS sessao_id,
        s.data_inicio,
        CASE
          WHEN s.data_inicio BETWEEN p_p1_inicio AND p_p1_fim THEN 1
          WHEN s.data_inicio BETWEEN p_p2_inicio AND p_p2_fim THEN 2
        END                 AS periodo
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
        COUNT(*) FILTER (WHERE periodo = 1)  AS total_p1,
        COUNT(*) FILTER (WHERE periodo = 2)  AS total_p2
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
        sp.periodo,
        sp.data_inicio
      FROM public.execucoes_exercicio ee
      INNER JOIN sessoes_periodos sp ON sp.sessao_id = ee.sessao_id
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 2B – Volumetria de ajuda por período (pivô em passo único).
    -- -----------------------------------------------------------------------
    resumo_ajuda AS (
      SELECT
        COUNT(*) FILTER (WHERE periodo = 1 AND registro_ajuda = 'autonomo')        AS autonomo_p1,
        COUNT(*) FILTER (WHERE periodo = 2 AND registro_ajuda = 'autonomo')        AS autonomo_p2,
        COUNT(*) FILTER (WHERE periodo = 1 AND registro_ajuda = 'ajuda_intrusiva') AS intrusiva_p1,
        COUNT(*) FILTER (WHERE periodo = 2 AND registro_ajuda = 'ajuda_intrusiva') AS intrusiva_p2
      FROM execucoes_base
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3A – Último nível de desenvolvimento por (exercicio, periodo).
    -- DISTINCT ON garante exatamente 1 linha por combinação usando o índice
    -- idx_execucoes_sessao_nivel.
    -- -----------------------------------------------------------------------
    ultimo_nivel_por_exercicio AS (
      SELECT DISTINCT ON (exercicio_id, periodo)
        exercicio_id,
        periodo,
        nivel_desenvolvimento
      FROM execucoes_base
      WHERE nivel_desenvolvimento IS NOT NULL
      -- Ordena pela execução mais recente do período: data da sessão como
      -- critério principal e created_at da execução como desempate fino,
      -- garantindo que uma regressão (ex: maduro → inicial) seja capturada.
      ORDER BY exercicio_id, periodo, data_inicio DESC, created_at DESC
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3B – Converte enum → peso numérico e pivota P1/P2 por exercício.
    -- -----------------------------------------------------------------------
    nivel_pivotado AS (
      SELECT
        exercicio_id,
        MAX(CASE WHEN periodo = 1 THEN
              CASE nivel_desenvolvimento
                WHEN 'inicial'       THEN 1
                WHEN 'intermediario' THEN 2
                WHEN 'maduro'        THEN 3
              END
        END) AS peso_p1,
        MAX(CASE WHEN periodo = 2 THEN
              CASE nivel_desenvolvimento
                WHEN 'inicial'       THEN 1
                WHEN 'intermediario' THEN 2
                WHEN 'maduro'        THEN 3
              END
        END) AS peso_p2,
        MAX(nivel_desenvolvimento::text) FILTER (WHERE periodo = 1) AS nivel_texto_p1,
        MAX(nivel_desenvolvimento::text) FILTER (WHERE periodo = 2) AS nivel_texto_p2
      FROM ultimo_nivel_por_exercicio
      GROUP BY exercicio_id
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 3C – Enriquece com título do exercício e calcula variação.
    -- -----------------------------------------------------------------------
    exercicios_evolucao AS (
      SELECT
        np.exercicio_id,
        ex.titulo,
        np.nivel_texto_p1   AS nivel_p1,
        np.nivel_texto_p2   AS nivel_p2,
        np.peso_p1,
        np.peso_p2,
        -- Variação numérica P2 - P1 (NULL quando o exercício só existe em um período)
        (np.peso_p2 - np.peso_p1) AS variacao_nivel
      FROM nivel_pivotado np
      INNER JOIN public.exercicios ex ON ex.id = np.exercicio_id
    ),

    -- -----------------------------------------------------------------------
    -- PASSO 4 – Comportamentos (Single-Scan via JOIN com sessoes_periodos).
    -- -----------------------------------------------------------------------
    comportamentos_base AS (
      SELECT
        cs.tipo,
        sp.periodo
      FROM public.comportamentos_sessao cs
      INNER JOIN sessoes_periodos sp ON sp.sessao_id = cs.sessao_id
    ),

    comportamentos_por_tipo AS (
      SELECT
        tipo,
        COUNT(*) FILTER (WHERE periodo = 1) AS total_p1,
        COUNT(*) FILTER (WHERE periodo = 2) AS total_p2
      FROM comportamentos_base
      GROUP BY tipo
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
    -- -------------------------------------------------------------------------
    'comportamentos', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'tipo',    cp.tipo,
            'total_p1', cp.total_p1,
            'total_p2', cp.total_p2,
            'diferenca_absoluta', ABS(cp.total_p2 - cp.total_p1),
            'variacao_percentual',
              CASE
                WHEN cp.total_p1 = 0 AND cp.total_p2 = 0  THEN 0.00
                WHEN cp.total_p1 = 0 AND cp.total_p2 > 0  THEN 100.00
                ELSE ROUND(
                  ((cp.total_p2 - cp.total_p1)::NUMERIC / cp.total_p1::NUMERIC) * 100,
                2)
              END
          )
          ORDER BY cp.tipo
        )
        FROM comportamentos_por_tipo cp
      ),
      '[]'::jsonb
    )

  ) INTO v_resultado;

  RETURN v_resultado;

END;
$$;

-- Permissão de execução para usuários autenticados via Supabase Auth
GRANT EXECUTE
  ON FUNCTION public.rpc_comparar_desempenho_periodos(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;
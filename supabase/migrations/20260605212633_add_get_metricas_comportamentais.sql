-- ════════════════════════════════════════════════════════════════════
-- Migration: Função — Métricas de Frequência Comportamental
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: Extrair métricas de frequência dos comportamentos
-- registrados em sessões de um aluno dentro de um intervalo de datas,
-- agrupando por tipo e detalhando as sessões e exercícios associados.
--
-- Parâmetros:
--   p_aluno_id    — UUID do aluno
--   p_data_inicio — início do intervalo (inclusive, nullable)
--   p_data_fim    — fim do intervalo (inclusive, nullable)
--
-- Retorno (JSONB):
--   Array de objetos ordenados por ocorrências DESC, cada um com:
--     · tipo              — categoria do comportamento
--     · ocorrencias       — total de registros no período
--     · ultima_ocorrencia — timestamp do registro mais recente
--     · sessoes           — array de sessões onde ocorreu, contendo:
--         · data                  — data_inicio da sessão
--         · exercicios_associados — array de títulos dos exercícios
--                                   vinculados (via execucao_id nullable)
--
-- Segurança:
--   SECURITY DEFINER + can_access_team garante que apenas membros
--   ativos da equipe responsável pelo aluno acessem os dados.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_metricas_comportamentais(
  p_aluno_id    UUID,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim    TIMESTAMPTZ
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
  SELECT equipe_id
    INTO v_equipe_id
    FROM public.alunos
   WHERE id = p_aluno_id;

  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não tem permissão para visualizar os dados deste aluno.';
  END IF;

  -- CTE 1
  WITH comportamentos_brutos AS (
    SELECT
      cs.id    AS comportamento_id,
      cs.tipo,
      s.id     AS sessao_id,
      s.data_inicio AS sessao_data,
      ex.titulo     AS exercicio_titulo
    FROM public.comportamentos_sessao cs
    JOIN public.sessoes s
      ON s.id = cs.sessao_id
    LEFT JOIN public.execucoes_exercicio ee
      ON ee.id = cs.execucao_id
    LEFT JOIN public.exercicios ex
      ON ex.id = ee.exercicio_id
    WHERE s.aluno_id = p_aluno_id
      AND s.status = 'concluida'::status_sessao
      AND (p_data_inicio IS NULL OR s.data_inicio >= p_data_inicio)
      AND (p_data_fim    IS NULL OR s.data_inicio <= p_data_fim)
  ),

  -- CTE 2
  comportamentos_por_sessao AS (
    SELECT
      tipo,
      sessao_id,
      sessao_data,
      COUNT(comportamento_id) AS qtd_na_sessao,
      COALESCE(
        jsonb_agg(exercicio_titulo ORDER BY exercicio_titulo)
        FILTER (WHERE exercicio_titulo IS NOT NULL),
        '[]'::jsonb
      ) AS exercicios_associados
    FROM comportamentos_brutos
    GROUP BY tipo, sessao_id, sessao_data
  ),

  -- CTE 3
  agrupamento_final AS (
    SELECT
      tipo,
      SUM(qtd_na_sessao)::INT AS ocorrencias,
      MAX(sessao_data)        AS ultima_ocorrencia,
      jsonb_agg(
        jsonb_build_object(
          'data',                  sessao_data,
          'exercicios_associados', exercicios_associados
        )
        ORDER BY sessao_data DESC
      ) AS sessoes
    FROM comportamentos_por_sessao
    GROUP BY tipo
  )

  -- Query final
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tipo',              tipo,
        'ocorrencias',       ocorrencias,
        'ultima_ocorrencia', ultima_ocorrencia,
        'sessoes',           sessoes
      )
      ORDER BY ocorrencias DESC
    ),
    '[]'::jsonb
  )
  INTO v_resultado
  FROM agrupamento_final;

  RETURN v_resultado;
END;
$$;
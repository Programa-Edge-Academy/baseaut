-- ════════════════════════════════════════════════════════════════════
-- Migration: Função — Métricas de Frequência Comportamental
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: Extrair métricas de frequência dos comportamentos
-- registrados em sessões de um aluno dentro de um intervalo de datas,
-- agrupando por tipo e detalhando as sessões e exercícios associados.
--
-- Parâmetros:
--   p_aluno_id   — UUID do aluno
--   p_data_inicio — início do intervalo (inclusive)
--   p_data_fim    — fim do intervalo (inclusive)
--
-- Retorno (JSONB):
--   Array de objetos ordenados por ocorrências DESC, cada um com:
--     · tipo              — categoria do comportamento
--     · ocorrencias       — total de registros no período
--     · ultima_ocorrencia — timestamp do registro mais recente
--     · sessoes           — array de sessões onde ocorreu, contendo:
--         · data                — data_inicio da sessão
--         · exercicios_associados — array de títulos dos exercícios
--                                   vinculados (via execucao_id nullable)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_metricas_comportamentais(
  p_aluno_id    UUID,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim    TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$

  -- CTE 1
  WITH comportamentos_periodo AS (
    SELECT
      cs.tipo,
      cs.created_at,
      s.data_inicio          AS sessao_data,
      s.id                   AS sessao_id,
      ex.titulo              AS exercicio_titulo
    FROM public.comportamentos_sessao cs
    INNER JOIN public.sessoes s
            ON s.id = cs.sessao_id
           AND s.aluno_id = p_aluno_id
           AND s.data_inicio BETWEEN p_data_inicio AND p_data_fim
    LEFT JOIN public.execucoes_exercicio ee
           ON ee.id = cs.execucao_id
    LEFT JOIN public.exercicios ex
           ON ex.id = ee.exercicio_id
  ),

  -- CTE 2
  comportamentos_por_sessao AS (
    SELECT
      tipo,
      sessao_id,
      sessao_data,
      COALESCE(
        jsonb_agg(exercicio_titulo ORDER BY exercicio_titulo)
        FILTER (WHERE exercicio_titulo IS NOT NULL),
        '[]'::jsonb
      ) AS exercicios_associados
    FROM comportamentos_periodo
    GROUP BY tipo, sessao_id, sessao_data
  )

  -- Query final
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tipo',               tipo,
        'ocorrencias',        ocorrencias,
        'ultima_ocorrencia',  ultima_ocorrencia,
        'sessoes',            sessoes
      )
      ORDER BY ocorrencias DESC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT
      tipo,
      COUNT(*)                    AS ocorrencias,
      MAX(sessao_data)            AS ultima_ocorrencia,
      jsonb_agg(
        jsonb_build_object(
          'data',                   sessao_data,
          'exercicios_associados',  exercicios_associados
        )
        ORDER BY sessao_data DESC
      )                           AS sessoes
    FROM comportamentos_por_sessao
    GROUP BY tipo
  ) resumo;

$$;
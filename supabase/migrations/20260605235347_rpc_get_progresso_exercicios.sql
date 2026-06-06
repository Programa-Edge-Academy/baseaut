-- ════════════════════════════════════════════════════════════════════
-- Migration: rpc_get_progresso_exercicios
-- US Associada: US 10.2
-- Objetivo: Calcular matematicamente a evolução motora diretamente no
--           banco, extraindo uma série temporal de execuções agrupada
--           por exercício para o aluno informado.
--
-- ── Arquitetura ──────────────────────────────────────────────────────
-- plpgsql com lookup rápido de equipe_id via PK (O(1)) + can_access_team
-- antes de qualquer JOIN custoso. A query principal usa três CTEs:
--
--   • base        → JOIN execucoes × sessoes × exercicios, com filtro
--                   de aluno, datas opcionais e nivel_desenvolvimento IS
--                   NOT NULL (execuções "nao_realizada" sem nível são
--                   irrelevantes para a série temporal de progresso).
--
--   • ranked      → adiciona Window Functions com ROW_NUMBER ascendente
--                   e descendente por exercício, conforme exigido pela US,
--                   para identificar a primeira e a última ocorrência.
--
--   • pivot       → usa MAX … FILTER para capturar os níveis numéricos do
--                   primeiro e do último registro. O total de sessões é
--                   calculado direto no GROUP BY com COUNT(*), evitando
--                   COUNT(*) OVER redundante em cada linha. O nó `historico`
--                   é gerado via jsonb_agg ORDER BY na mesma etapa de
--                   agrupamento.
--
-- ── Regra de evolução ────────────────────────────────────────────────
-- A conversão ENUM → inteiro permite comparação aritmética pura no DB:
--   inicial = 1 · intermediario = 2 · maduro = 3
--
--   total_sessoes = 1          → 'Aguardando novos registros'
--   nivel_ultimo  > primeiro   → 'Melhorou'
--   nivel_ultimo  = primeiro   → 'Estável'
--   nivel_ultimo  < primeiro   → 'Precisa reforço'
--
-- ── Segurança ───────────────────────────────────────────────────────
-- can_access_team() chamada após lookup de equipe_id via PK (O(1)),
-- antes de qualquer JOIN custoso. SECURITY DEFINER + search_path fixo.
--
-- ── Índices ──────────────────────────────────────────────────────────
-- Declarados ao final, cobrindo os predicados críticos de WHERE e JOIN
-- sem criar índices redundantes com os já existentes no schema.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_progresso_exercicios(
    p_aluno_id    UUID,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim    DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_equipe_id UUID;   -- equipe_id resolvido para validação de acesso
    v_resultado JSONB;  -- array final de retorno
BEGIN

    -- ══════════════════════════════════════════════════════════════════
    -- 1. Resolução do equipe_id (lookup via PK — O(1))
    --    Feita ANTES de qualquer JOIN custoso para falhar rápido.
    -- ══════════════════════════════════════════════════════════════════
    SELECT equipe_id
    INTO   v_equipe_id
    FROM   public.alunos
    WHERE  id = p_aluno_id;

    IF v_equipe_id IS NULL THEN
        RAISE EXCEPTION
            'Aluno não encontrado ou sem equipe vinculada. (id: %)',
            p_aluno_id;
    END IF;


    -- ══════════════════════════════════════════════════════════════════
    -- 2. Verificação de acesso
    --    can_access_team() cobre membros ativos (is_team_member) e o
    --    coordenador responsável (is_team_coordinator).
    -- ══════════════════════════════════════════════════════════════════
    IF NOT public.can_access_team(v_equipe_id) THEN
        RAISE EXCEPTION
            'Acesso negado: usuário % não possui permissão para visualizar os dados deste aluno.',
            auth.uid();
    END IF;


    -- ══════════════════════════════════════════════════════════════════
    -- 3. Montagem do payload via CTEs
    -- ══════════════════════════════════════════════════════════════════
    WITH

    -- ── CTE 1: base ──────────────────────────────────────────────────
    -- Conjunto de execuções com nível de desenvolvimento registrado.
    -- Execuções com status 'nao_realizada' sem nivel_desenvolvimento são
    -- excluídas — não aportam informação à série temporal de progresso.
    --
    -- Otimização importante: o filtro de datas usa range em data_inicio
    -- sem aplicar cast na coluna. Assim, o índice
    -- idx_sessoes_aluno_data_inicio continua utilizável pelo planner.
    -- A regra mantém p_data_fim inclusivo, convertendo-o para o limite
    -- exclusivo do dia seguinte.
    base AS (
        SELECT
            ee.id                             AS execucao_id,
            ee.exercicio_id,
            ex.titulo                         AS exercicio_nome,
            s.data_inicio,
            ee.nivel_desenvolvimento::TEXT    AS nivel_texto,
            CASE ee.nivel_desenvolvimento
                WHEN 'inicial'       THEN 1
                WHEN 'intermediario' THEN 2
                WHEN 'maduro'        THEN 3
            END                               AS nivel_num
        FROM  public.sessoes s
        INNER JOIN public.execucoes_exercicio ee ON ee.sessao_id    = s.id
        INNER JOIN public.exercicios ex          ON ex.id           = ee.exercicio_id
        WHERE s.aluno_id = p_aluno_id
          AND ee.nivel_desenvolvimento IS NOT NULL
          AND (p_data_inicio IS NULL OR s.data_inicio >= p_data_inicio::TIMESTAMPTZ)
          AND (p_data_fim    IS NULL OR s.data_inicio <  (p_data_fim + 1)::TIMESTAMPTZ)
    ),

    -- ── CTE 2: ranked ─────────────────────────────────────────────────
    -- Calcula as posições cronológicas por exercício usando ROW_NUMBER(),
    -- conforme o critério de aceite da US:
    --   • rn_asc  → primeira ocorrência por exercício
    --   • rn_desc → última ocorrência por exercício
    --
    -- O COUNT(*) OVER foi evitado porque o total é mais barato e simples
    -- no GROUP BY final. O tiebreak por execucao_id garante determinismo
    -- quando dois registros caem no mesmo data_inicio.
    ranked AS (
        SELECT
            *,
            ROW_NUMBER() OVER (
                PARTITION BY exercicio_id
                ORDER BY data_inicio ASC, execucao_id ASC
            ) AS rn_asc,
            ROW_NUMBER() OVER (
                PARTITION BY exercicio_id
                ORDER BY data_inicio DESC, execucao_id DESC
            ) AS rn_desc
        FROM base
    ),

    -- ── CTE 3: pivot ──────────────────────────────────────────────────
    -- Único GROUP BY que produz, ao mesmo tempo:
    --   • nivel_primeiro → via MAX … FILTER sobre rn_asc = 1
    --   • nivel_ultimo   → via MAX … FILTER sobre rn_desc = 1
    --   • total_sessoes  → COUNT(*) direto no agrupamento
    --   • historico      → jsonb_agg cronológico
    pivot AS (
        SELECT
            exercicio_id,
            MAX(exercicio_nome)                                          AS nome,
            COUNT(*)                                                     AS total_sessoes,
            MAX(nivel_num) FILTER (WHERE rn_asc  = 1)                    AS nivel_primeiro,
            MAX(nivel_num) FILTER (WHERE rn_desc = 1)                    AS nivel_ultimo,
            jsonb_agg(
                jsonb_build_object(
                    'data',                  data_inicio,
                    'nivel_desenvolvimento', nivel_texto
                )
                ORDER BY data_inicio ASC, execucao_id ASC
            )                                                            AS historico
        FROM ranked
        GROUP BY exercicio_id
    )

    -- ── Agregação final ───────────────────────────────────────────────
    -- Monta o array de exercícios com a string de evolução calculada
    -- inteiramente no banco. Ordenado por nome para resultado estável.
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'exercicio_id',  exercicio_id,
                'nome',          nome,
                'total_sessoes', total_sessoes,
                'evolucao',      CASE
                    WHEN total_sessoes = 1              THEN 'Aguardando novos registros'
                    WHEN nivel_ultimo  > nivel_primeiro THEN 'Melhorou'
                    WHEN nivel_ultimo  = nivel_primeiro THEN 'Estável'
                    ELSE                                     'Precisa reforço'
                END,
                'historico',     historico
            )
            ORDER BY nome ASC
        ),
        '[]'::jsonb
    )
    INTO v_resultado
    FROM pivot;


    -- ══════════════════════════════════════════════════════════════════
    -- 4. Retorno
    -- ══════════════════════════════════════════════════════════════════
    RETURN v_resultado;

END;
$$;


-- ════════════════════════════════════════════════════════════════════
-- ÍNDICES DE APOIO
-- ════════════════════════════════════════════════════════════════════

-- P1: filtragem de sessões por aluno + range de data_inicio.
--     Importante manter o filtro da RPC sem cast em s.data_inicio para
--     permitir o uso eficiente deste índice.
CREATE INDEX IF NOT EXISTS idx_sessoes_aluno_data_inicio
    ON public.sessoes (aluno_id, data_inicio);

-- P2: índice parcial em execucoes_exercicio para o JOIN via sessao_id,
--     restrito a linhas com nivel_desenvolvimento preenchido.
--     Inclui id e nivel_desenvolvimento para cobrir as colunas usadas
--     pela série temporal. A ordenação cronológica continua sendo baseada
--     em s.data_inicio, vindo da tabela sessoes.
CREATE INDEX IF NOT EXISTS idx_execucoes_sessao_exercicio_nivel_cobertura
    ON public.execucoes_exercicio (sessao_id, exercicio_id, id)
    INCLUDE (nivel_desenvolvimento)
    WHERE nivel_desenvolvimento IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- GRANT DE EXECUÇÃO
-- Autenticação real é feita internamente via can_access_team().
-- ════════════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION public.rpc_get_progresso_exercicios(UUID, DATE, DATE)
    TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- Migration: rpc_get_registro_exportacao
-- US Associada: US 17.5
-- Objetivo: Extrator de dados em massa para exportação de um evento
--           completo (sessão ou formulário) como JSONB estruturado,
--           pronto para geração de PDF no Front-end ou Edge Function.
--
-- ── Arquitetura ──────────────────────────────────────────────────────
-- plpgsql com IF/ELSE para separar os dois fluxos. Cada fluxo executa
-- uma única query SQL com JOINs e LEFT JOIN LATERAL, evitando
-- round-trips e subqueries correlacionadas duplicadas.
--
-- ── Otimizações aplicadas nesta revisão ──────────────────────────────
-- 1) Fluxo "sessao": registros_suporte e comportamentos_sessao agora
--    são pré-agregados por execução em CTEs dentro do LATERAL da sessão.
--    Isso evita executar subqueries aninhadas uma vez para cada linha de
--    execucoes_exercicio.
--
-- 2) Fluxo "formulario": equipe_id e template_origem_id são resolvidos
--    no mesmo lookup inicial por PK. Assim evitamos uma segunda leitura
--    de formularios antes da montagem do JSON.
--
-- 3) Índices: removido o índice manual em respostas_formulario
--    (formulario_id, pergunta_id), pois a constraint única
--    uq_resposta_por_formulario_pergunta já cria um índice equivalente.
--
-- ── Fluxo "sessao" ──────────────────────────────────────────────────
-- sessoes → alunos, profiles (monitor)
-- LEFT JOIN LATERAL → execucoes_exercicio × exercicios
--                   → registros_suporte pré-agregados por execução
--                   → comportamentos_sessao pré-agregados por execução
--                   → comportamentos_sessao de nível sessão
--
-- ── Fluxo "formulario" ─────────────────────────────────────────────
-- formularios → alunos, profiles (avaliador)
-- LEFT JOIN LATERAL → perguntas (template) × respostas_formulario
-- O lado esquerdo são sempre as perguntas do template de origem,
-- garantindo 100% dos itens no output mesmo quando ainda sem resposta.
--
-- ── Segurança ───────────────────────────────────────────────────────
-- can_access_team() é chamado após resolver o equipe_id via PK (O(1)),
-- antes de qualquer JOIN custoso. SECURITY DEFINER + search_path fixo.
--
-- ── Índices ─────────────────────────────────────────────────────────
-- Declarados ao final, cobrindo os predicados de WHERE e JOINs
-- críticos de cada fluxo sem criar índices redundantes.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_registro_exportacao(
  p_tipo TEXT,   -- 'sessao' | 'formulario'
  p_id   UUID    -- ID do registro a exportar
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipe_id   UUID;   -- equipe_id resolvido para validação de acesso
  v_template_id UUID;   -- template de origem (branch formulário)
  v_resultado   JSONB;  -- objeto final de retorno
BEGIN

  -- ══════════════════════════════════════════════════════════════════
  -- 1. Validação do parâmetro de tipo
  -- ══════════════════════════════════════════════════════════════════
  IF p_tipo NOT IN ('sessao', 'formulario') THEN
    RAISE EXCEPTION
      'p_tipo inválido: "%". Use "sessao" ou "formulario".',
      p_tipo;
  END IF;


  -- ══════════════════════════════════════════════════════════════════
  -- 2. Resolução do equipe_id (lookup via PK — O(1))
  --    Feita ANTES de qualquer JOIN custoso para falhar rápido.
  --
  --    Otimização no branch formulário:
  --    já capturamos COALESCE(template_origem_id, id) neste mesmo
  --    lookup, evitando uma segunda leitura de public.formularios.
  -- ══════════════════════════════════════════════════════════════════
  IF p_tipo = 'sessao' THEN
    SELECT equipe_id
    INTO   v_equipe_id
    FROM   public.sessoes
    WHERE  id = p_id;
  ELSE
    SELECT equipe_id,
           COALESCE(template_origem_id, id)
    INTO   v_equipe_id,
           v_template_id
    FROM   public.formularios
    WHERE  id = p_id;
  END IF;

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION
      'Registro % (tipo: %) não encontrado.',
      p_id, p_tipo;
  END IF;


  -- ══════════════════════════════════════════════════════════════════
  -- 3. Verificação de acesso
  --    can_access_team() cobre membros ativos (is_team_member) e o
  --    coordenador responsável (is_team_coordinator).
  -- ══════════════════════════════════════════════════════════════════
  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION
      'Acesso negado: usuário % não possui permissão para este registro.',
      auth.uid();
  END IF;


  -- ══════════════════════════════════════════════════════════════════
  -- BRANCH A — SESSÃO
  -- ══════════════════════════════════════════════════════════════════
  IF p_tipo = 'sessao' THEN

    SELECT jsonb_build_object(

      -- ── Cabeçalho da sessão ───────────────────────────────────────
      'tipo',               'sessao',
      'id',                 s.id,
      'status',             s.status,
      'data_agendada',      s.data_agendada,
      'data_inicio',        s.data_inicio,
      'data_fim',           s.data_fim,
      'observacoes_gerais', s.observacoes_gerais,
      'motivo_finalizacao', s.motivo_finalizacao,
      'descricao_motivo',   s.descricao_motivo,
      'created_at',         s.created_at,

      -- ── Dados do aluno ────────────────────────────────────────────
      'dados_aluno', jsonb_build_object(
        'id',                    a.id,
        'nome_completo',         a.nome_completo,
        'data_nascimento',       a.data_nascimento,
        'nivel_suporte',         a.nivel_suporte,
        'diagnostico_detalhado', a.diagnostico_detalhado,
        'observacoes_clinicas',  a.observacoes_clinicas,
        'altura',                a.altura,
        'peso',                  a.peso,
        'cintura',               a.cintura,
        'mao_preferida',         a.mao_preferida
      ),

      -- ── Dados do monitor ─────────────────────────────────────────
      'dados_monitor', jsonb_build_object(
        'id',            m.id,
        'nome_completo', m.nome_completo,
        'email',         m.email,
        'role',          m.role
      ),

      -- ── Exercícios executados (com suportes e comportamentos) ─────
      'conteudo', sessao_agg.execucoes,

      -- ── Comportamentos de nível sessão (sem execução vinculada) ───
      'comportamentos_sessao', sessao_agg.comportamentos_sessao

    )
    INTO  v_resultado
    FROM  public.sessoes      s
    INNER JOIN public.alunos    a  ON a.id = s.aluno_id
    INNER JOIN public.profiles  m  ON m.id = s.monitor_id

    -- ── LATERAL A1: agregações completas da sessão ──────────────────
    -- Antes: cada execução disparava duas subqueries independentes
    --        (registros_suporte e comportamentos por execução).
    -- Agora: a sessão é resolvida em blocos pré-agregados:
    --        • exec_base                    → execuções + exercício
    --        • registros_suporte_agg        → 1 array por execucao_id
    --        • comportamentos_execucao_agg  → 1 array por execucao_id
    --        • comportamentos_sessao_agg    → array de nível sessão
    --
    -- Resultado: menos leituras repetidas e menos nested loops quando
    -- uma sessão possui várias execuções.
    LEFT JOIN LATERAL (
      WITH exec_base AS (
        SELECT
          ee.id,
          ee.ordem_execucao,
          ee.status_realizacao,
          ee.nivel_desenvolvimento,
          ee.registro_ajuda,
          ee.complementos_ajuda,
          ee.motivo_nao_realizacao,
          ee.descricao_adicional,
          ee.duracao_real_segundos,
          ee.tempo_maximo_atingido,
          ee.video_url,
          ex.id                 AS exercicio_id,
          ex.titulo             AS exercicio_titulo,
          ex.descricao          AS exercicio_descricao,
          ex.instrucoes_verbais AS exercicio_instrucoes_verbais,
          ex.midia_url          AS exercicio_midia_url
        FROM public.execucoes_exercicio ee
        INNER JOIN public.exercicios ex ON ex.id = ee.exercicio_id
        WHERE ee.sessao_id = s.id
      ),

      registros_suporte_agg AS (
        SELECT
          rs.execucao_id,
          jsonb_agg(
            jsonb_build_object(
              'id',          rs.id,
              'tipo',        rs.tipo,
              'intensidade', rs.intensidade,
              'observacao',  rs.observacao,
              'created_at',  rs.created_at
            )
            ORDER BY rs.created_at
          ) AS lista
        FROM public.registros_suporte rs
        INNER JOIN exec_base eb ON eb.id = rs.execucao_id
        GROUP BY rs.execucao_id
      ),

      comportamentos_execucao_agg AS (
        SELECT
          cs.execucao_id,
          jsonb_agg(
            jsonb_build_object(
              'id',         cs.id,
              'tipo',       cs.tipo,
              'observacao', cs.observacao,
              'created_at', cs.created_at
            )
            ORDER BY cs.created_at
          ) AS lista
        FROM public.comportamentos_sessao cs
        INNER JOIN exec_base eb ON eb.id = cs.execucao_id
        GROUP BY cs.execucao_id
      ),

      comportamentos_sessao_agg AS (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id',         cs.id,
              'tipo',       cs.tipo,
              'observacao', cs.observacao,
              'created_at', cs.created_at
            )
            ORDER BY cs.created_at
          ),
          '[]'::jsonb
        ) AS lista
        FROM public.comportamentos_sessao cs
        WHERE cs.sessao_id = s.id
          AND cs.execucao_id IS NULL
      )

      SELECT
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id',                    eb.id,
              'ordem_execucao',        eb.ordem_execucao,
              'status_realizacao',     eb.status_realizacao,
              'nivel_desenvolvimento', eb.nivel_desenvolvimento,
              'registro_ajuda',        eb.registro_ajuda,
              'complementos_ajuda',    eb.complementos_ajuda,
              'motivo_nao_realizacao', eb.motivo_nao_realizacao,
              'descricao_adicional',   eb.descricao_adicional,
              'duracao_real_segundos', eb.duracao_real_segundos,
              'tempo_maximo_atingido', eb.tempo_maximo_atingido,
              'video_url',             eb.video_url,

              -- Dados descritivos do exercício
              'exercicio', jsonb_build_object(
                'id',                 eb.exercicio_id,
                'titulo',             eb.exercicio_titulo,
                'descricao',          eb.exercicio_descricao,
                'instrucoes_verbais', eb.exercicio_instrucoes_verbais,
                'midia_url',          eb.exercicio_midia_url
              ),

              -- Registros de suporte desta execução
              'registros_suporte', COALESCE(rs_agg.lista, '[]'::jsonb),

              -- Comportamentos vinculados a esta execução
              'comportamentos', COALESCE(ce_agg.lista, '[]'::jsonb)
            )
            ORDER BY eb.ordem_execucao
          ),
          '[]'::jsonb
        ) AS execucoes,

        COALESCE(
          (SELECT csa.lista FROM comportamentos_sessao_agg csa),
          '[]'::jsonb
        ) AS comportamentos_sessao

      FROM exec_base eb
      LEFT JOIN registros_suporte_agg       rs_agg ON rs_agg.execucao_id = eb.id
      LEFT JOIN comportamentos_execucao_agg ce_agg ON ce_agg.execucao_id = eb.id
    ) sessao_agg ON TRUE

    WHERE s.id = p_id;


  -- ══════════════════════════════════════════════════════════════════
  -- BRANCH B — FORMULÁRIO
  -- ══════════════════════════════════════════════════════════════════
  ELSE

    SELECT jsonb_build_object(

      -- ── Cabeçalho do formulário ───────────────────────────────────
      'tipo',               'formulario',
      'id',                 f.id,
      'titulo',             f.titulo,
      'descricao',          f.descricao,
      'tipo_formulario',    f.tipo,
      'protegido',          f.protegido,
      'metadados',          f.metadados,
      'template_origem_id', f.template_origem_id,
      'created_at',         f.created_at,
      'updated_at',         f.updated_at,

      -- ── Dados do aluno ────────────────────────────────────────────
      -- LEFT JOIN: formulários-template não têm aluno_id
      'dados_aluno', CASE
        WHEN a.id IS NOT NULL THEN jsonb_build_object(
          'id',                    a.id,
          'nome_completo',         a.nome_completo,
          'data_nascimento',       a.data_nascimento,
          'nivel_suporte',         a.nivel_suporte,
          'diagnostico_detalhado', a.diagnostico_detalhado,
          'observacoes_clinicas',  a.observacoes_clinicas,
          'altura',                a.altura,
          'peso',                  a.peso,
          'cintura',               a.cintura,
          'mao_preferida',         a.mao_preferida
        )
        ELSE NULL
      END,

      -- ── Dados do avaliador ────────────────────────────────────────
      -- LEFT JOIN: formulários antigos podem não ter avaliador_id
      'dados_avaliador', CASE
        WHEN av.id IS NOT NULL THEN jsonb_build_object(
          'id',            av.id,
          'nome_completo', av.nome_completo,
          'email',         av.email,
          'role',          av.role
        )
        ELSE NULL
      END,

      -- ── Itens: perguntas do template × respostas da instância ─────
      -- Lado esquerdo = perguntas do template de origem.
      --   → Garante que TODOS os itens apareçam no PDF, mesmo os
      --     ainda não respondidos (rf.* será NULL nesses casos).
      -- Lado direito = respostas gravadas para esta instância (p_id).
      -- Um único LATERAL produz o array ordenado por pergunta.ordem.
      'conteudo', itens_agg.lista

    )
    INTO  v_resultado
    FROM  public.formularios  f
    LEFT JOIN public.alunos    a  ON a.id  = f.aluno_id
    LEFT JOIN public.profiles  av ON av.id = f.avaliador_id

    -- ── LATERAL B1: perguntas × respostas ───────────────────────────
    LEFT JOIN LATERAL (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            -- Dados da pergunta (vêm do template)
            'pergunta_id',    pq.id,
            'ordem',          pq.ordem,
            'texto_pergunta', pq.texto_pergunta,
            'tipo_resposta',  pq.tipo_resposta,
            'opcoes',         pq.opcoes,
            'obrigatoria',    pq.obrigatoria,
            'protegida',      pq.protegida,

            -- Dados da resposta (da instância; NULL se ainda sem resposta)
            'resposta_id',      rf.id,
            'valor_preenchido', rf.valor_preenchido,
            'valor_ajuda',      rf.valor_ajuda,
            'status_item',      COALESCE(rf.status_item::text, 'sem_resposta'),
            'respondido_em',    rf.atualizado_em
          )
          ORDER BY pq.ordem
        ),
        '[]'::jsonb
      ) AS lista
      FROM  public.perguntas pq
      LEFT JOIN public.respostas_formulario rf
             ON rf.pergunta_id   = pq.id
            AND rf.formulario_id = p_id       -- filtra pela INSTÂNCIA
      WHERE pq.formulario_id = v_template_id  -- itera o TEMPLATE
    ) itens_agg ON TRUE

    WHERE f.id = p_id;

  END IF;


  -- ══════════════════════════════════════════════════════════════════
  -- 4. Retorno
  -- ══════════════════════════════════════════════════════════════════
  RETURN v_resultado;

END;
$$;


-- ════════════════════════════════════════════════════════════════════
-- ÍNDICES DE APOIO
-- ════════════════════════════════════════════════════════════════════

-- A1: execuções por sessão, ordenadas para o jsonb_agg
CREATE INDEX IF NOT EXISTS idx_execucoes_sessao_ordem
  ON public.execucoes_exercicio (sessao_id, ordem_execucao);

-- A1: registros de suporte por execução
CREATE INDEX IF NOT EXISTS idx_registros_suporte_execucao
  ON public.registros_suporte (execucao_id, created_at);

-- A1/A2: comportamentos por sessão/execução
-- Índice parcial para a query de nível sessão (execucao_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_comportamentos_sessao_nivel_sessao
  ON public.comportamentos_sessao (sessao_id, created_at)
  WHERE execucao_id IS NULL;

-- A1: comportamentos por execução (lado "com execução")
CREATE INDEX IF NOT EXISTS idx_comportamentos_execucao
  ON public.comportamentos_sessao (execucao_id, created_at)
  WHERE execucao_id IS NOT NULL;

-- B1: perguntas por formulário (template), ordenadas
CREATE INDEX IF NOT EXISTS idx_perguntas_formulario_ordem
  ON public.perguntas (formulario_id, ordem);

-- Observação: não criamos índice manual em respostas_formulario
-- (formulario_id, pergunta_id), porque a constraint única
-- uq_resposta_por_formulario_pergunta já cria um índice B-tree
-- equivalente e suficiente para o LEFT JOIN do fluxo formulário.


-- ════════════════════════════════════════════════════════════════════
-- GRANT DE EXECUÇÃO
-- Autenticação real é feita internamente via can_access_team().
-- ════════════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION public.rpc_get_registro_exportacao(TEXT, UUID)
  TO authenticated;

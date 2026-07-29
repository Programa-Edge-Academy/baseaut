-- ════════════════════════════════════════════════════════════════════
-- Migration: rpc_get_registro_exportacao
-- US Associada: US 17.5 / US 10.7 / Épico 11
-- Objetivo: Extrator de dados em massa para exportação de um evento
--           completo (sessão ou formulário) como JSONB estruturado,
--           pronto para geração de PDF no Front-end ou Edge Function.
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
  v_tipo_form   TEXT;   -- tipo do formulário para verificar se é MABC-2
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
  -- ══════════════════════════════════════════════════════════════════
  IF p_tipo = 'sessao' THEN
    SELECT equipe_id
    INTO   v_equipe_id
    FROM   public.sessoes
    WHERE  id = p_id;
  ELSE
    SELECT equipe_id,
           COALESCE(template_origem_id, id),
           tipo
    INTO   v_equipe_id,
           v_template_id,
           v_tipo_form
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
      -- Passo 1: Renomeado para comportamentos_observados
      'comportamentos_observados', sessao_agg.comportamentos_sessao

    )
    INTO  v_resultado
    FROM  public.sessoes      s
    INNER JOIN public.alunos    a  ON a.id = s.aluno_id
    INNER JOIN public.profiles  m  ON m.id = s.monitor_id

    LEFT JOIN LATERAL (
      WITH exec_base AS (
        SELECT
          ee.id,
          ee.ordem_execucao,
          ee.status_realizacao,
          ee.nivel_desenvolvimento,
          ee.registro_ajuda,
          ee.complementos_ajuda, -- Passo 1: garantindo a coluna complementos_ajuda
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
      -- Passo 2 e 3: Agrupamento MABC-2 se f.tipo = 'mabc2'
      'conteudo', CASE 
        WHEN f.tipo = 'mabc2' THEN itens_agg.mabc2_agrupado 
        ELSE itens_agg.lista 
      END

    )
    INTO  v_resultado
    FROM  public.formularios  f
    LEFT JOIN public.alunos    a  ON a.id  = f.aluno_id
    LEFT JOIN public.profiles  av ON av.id = f.avaliador_id

    -- ── LATERAL B1: perguntas × respostas ───────────────────────────
    LEFT JOIN LATERAL (
      WITH raw_items AS (
        SELECT 
          pq.id AS pergunta_id,
          pq.ordem,
          pq.texto_pergunta,
          pq.tipo_resposta,
          pq.opcoes,
          pq.obrigatoria,
          pq.protegida,
          -- Para o agrupamento MABC-2
          COALESCE(pq.metadados->>'componente', pq.metadados->>'componente_motor', 'Outros') AS componente,
          rf.id AS resposta_id,
          rf.valor_preenchido,
          rf.valor_ajuda, -- Passo 3: Incluir valor_ajuda
          COALESCE(rf.status_item::text, 'sem_resposta') AS status_item,
          rf.atualizado_em AS respondido_em
        FROM  public.perguntas pq
        LEFT JOIN public.respostas_formulario rf
               ON rf.pergunta_id   = pq.id
              AND rf.formulario_id = p_id       -- filtra pela INSTÂNCIA
        WHERE pq.formulario_id = v_template_id  -- itera o TEMPLATE
      )
      SELECT 
        -- Lista normal (reta) para formulários não-mabc2
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'pergunta_id',    r.pergunta_id,
                'ordem',          r.ordem,
                'texto_pergunta', r.texto_pergunta,
                'tipo_resposta',  r.tipo_resposta,
                'opcoes',         r.opcoes,
                'obrigatoria',    r.obrigatoria,
                'protegida',      r.protegida,
                'resposta_id',      r.resposta_id,
                'valor_preenchido', r.valor_preenchido,
                'valor_ajuda',      r.valor_ajuda,
                'status_item',      r.status_item,
                'respondido_em',    r.respondido_em
              )
              ORDER BY r.ordem
            ) FROM raw_items r
          ),
          '[]'::jsonb
        ) AS lista,
        
        -- Lista agrupada para MABC-2 (Destreza, Pontaria, Equilíbrio)
        COALESCE(
          (
            SELECT jsonb_build_object(
              'Destreza', COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'pergunta_id',    r.pergunta_id,
                    'ordem',          r.ordem,
                    'texto_pergunta', r.texto_pergunta,
                    'tipo_resposta',  r.tipo_resposta,
                    'opcoes',         r.opcoes,
                    'obrigatoria',    r.obrigatoria,
                    'protegida',      r.protegida,
                    'resposta_id',      r.resposta_id,
                    'valor_preenchido', r.valor_preenchido,
                    'valor_ajuda',      r.valor_ajuda,
                    'status_item',      r.status_item,
                    'respondido_em',    r.respondido_em
                  ) ORDER BY r.ordem
                ) FILTER (WHERE r.componente ILIKE '%destreza%'), '[]'::jsonb
              ),
              'Pontaria', COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'pergunta_id',    r.pergunta_id,
                    'ordem',          r.ordem,
                    'texto_pergunta', r.texto_pergunta,
                    'tipo_resposta',  r.tipo_resposta,
                    'opcoes',         r.opcoes,
                    'obrigatoria',    r.obrigatoria,
                    'protegida',      r.protegida,
                    'resposta_id',      r.resposta_id,
                    'valor_preenchido', r.valor_preenchido,
                    'valor_ajuda',      r.valor_ajuda,
                    'status_item',      r.status_item,
                    'respondido_em',    r.respondido_em
                  ) ORDER BY r.ordem
                ) FILTER (WHERE r.componente ILIKE '%pontaria%'), '[]'::jsonb
              ),
              'Equilíbrio', COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'pergunta_id',    r.pergunta_id,
                    'ordem',          r.ordem,
                    'texto_pergunta', r.texto_pergunta,
                    'tipo_resposta',  r.tipo_resposta,
                    'opcoes',         r.opcoes,
                    'obrigatoria',    r.obrigatoria,
                    'protegida',      r.protegida,
                    'resposta_id',      r.resposta_id,
                    'valor_preenchido', r.valor_preenchido,
                    'valor_ajuda',      r.valor_ajuda,
                    'status_item',      r.status_item,
                    'respondido_em',    r.respondido_em
                  ) ORDER BY r.ordem
                ) FILTER (WHERE r.componente ILIKE '%equil_brio%' OR r.componente ILIKE '%equilibrio%'), '[]'::jsonb
              )
            ) FROM raw_items r
          ),
          '{}'::jsonb
        ) AS mabc2_agrupado

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

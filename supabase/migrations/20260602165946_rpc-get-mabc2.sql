-- ════════════════════════════════════════════════════════════════════
-- RPC: rpc_get_mabc2_formulario
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: retornar o objeto JSONB completo de uma avaliação MABC-2
-- específica, com os 5 nós: formulario, aluno, avaliador, itens e
-- resumo_pendencias.
--
-- Engenharia de dados central:
--   • O nó "itens" é construído via LEFT JOIN onde o lado ESQUERDO são
--     as perguntas do template de origem (garantindo 100% dos itens da
--     prova, mesmo sem resposta), e o lado DIREITO são as respostas
--     gravadas na instância do aluno (podem ser NULL).
--   • O nó "resumo_pendencias" usa COUNT(...) FILTER (WHERE ...) para
--     calcular respondidos / adiados / nao_realizados.
--   • Otimização aplicada: "itens" e "resumo_pendencias" agora são
--     calculados dentro do mesmo LEFT JOIN LATERAL, reaproveitando a
--     mesma varredura em perguntas + respostas_formulario.
--
-- Ganho da otimização:
--   • Evita executar duas subqueries quase idênticas sobre o mesmo
--     conjunto de dados.
--   • Reduz leitura, JOIN e agregação duplicada.
--   • Mantém exatamente o mesmo formato JSONB de retorno.
--
-- Tabelas acessadas (somente leitura):
--   • public.formularios          — instância + nó "formulario"
--   • public.alunos               — nó "aluno"
--   • public.profiles             — nó "avaliador"
--   • public.perguntas            — lado esquerdo do LEFT JOIN (template)
--   • public.respostas_formulario — lado direito do LEFT JOIN (instância)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_mabc2_formulario(
  p_formulario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_resultado   JSONB;
BEGIN
  -- ── Passo 1: resolver o template_origem_id ──────────────────────
  -- Armazena em variável para reutilizar nos JOINs subsequentes.
  -- Isso também permite validar cedo se a instância informada existe
  -- e se está ligada a um template de origem.
  SELECT template_origem_id
  INTO   v_template_id
  FROM   public.formularios
  WHERE  id = p_formulario_id;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION
      'Formulário % não encontrado ou não possui template de origem.',
      p_formulario_id;
  END IF;

  -- ── Passo 2: montar o objeto JSONB com os 5 nós ─────────────────
  -- A query principal une formulario + aluno + avaliador (1 linha).
  --
  -- Otimização:
  --   Em vez de montar "itens" em uma subquery e "resumo_pendencias"
  --   em outra subquery, ambas repetindo o mesmo LEFT JOIN, usamos um
  --   LEFT JOIN LATERAL.
  --
  -- O LATERAL permite que a subquery "agg" enxergue a linha atual de
  -- public.formularios e calcule, de uma vez:
  --   • agg.itens
  --   • agg.total_itens
  --   • agg.respondidos
  --   • agg.adiados
  --   • agg.nao_realizados
  --
  -- Assim, o banco percorre perguntas + respostas_formulario uma única
  -- vez para a avaliação solicitada.
  SELECT jsonb_build_object(

    -- ── Nó 1: metadados do formulário/instância ──────────────────
    'formulario', jsonb_build_object(
      'id',                 f.id,
      'titulo',             f.titulo,
      'descricao',          f.descricao,
      'tipo',               f.tipo::TEXT,
      'ativo',              f.ativo,
      'metadados',          f.metadados,
      'template_origem_id', f.template_origem_id,
      'created_at',         f.created_at,
      'updated_at',         f.updated_at
    ),

    -- ── Nó 2: dados clínicos do aluno ────────────────────────────
    'aluno', jsonb_build_object(
      'id',              a.id,
      'nome_completo',   a.nome_completo,
      'data_nascimento', a.data_nascimento,
      'mao_preferida',   a.mao_preferida,
      'altura',          a.altura,
      'peso',            a.peso
    ),

    -- ── Nó 3: perfil do avaliador que aplicou o instrumento ──────
    'avaliador', jsonb_build_object(
      'id',            pr.id,
      'nome_completo', pr.nome_completo,
      'email',         pr.email
    ),

    -- ── Nó 4: array completo de itens da prova ───────────────────
    -- Lado ESQUERDO: perguntas do TEMPLATE (pq.formulario_id = v_template_id)
    --   → garante que todos os itens da bateria aparecem, mesmo sem resposta.
    -- Lado DIREITO: respostas da INSTÂNCIA (rf.formulario_id = p_formulario_id)
    --   → colunas serão NULL quando o item ainda não foi respondido.
    --
    -- Como os itens são calculados dentro de agg, basta reutilizar
    -- agg.itens no JSON final.
    'itens', COALESCE(agg.itens, '[]'::JSONB),

    -- ── Nó 5: resumo matemático de pendências ────────────────────
    -- Os totais abaixo vêm da mesma varredura usada para montar "itens".
    --
    -- COUNT(rf.id) FILTER (WHERE ...) agrega por status sem múltiplas
    -- subqueries.
    --
    -- tem_pendencia = TRUE quando total de perguntas > total de respondidas.
    -- Ou seja: existe ao menos um item que não foi concluído como respondido.
    'resumo_pendencias', jsonb_build_object(
      'total_itens',    COALESCE(agg.total_itens, 0),
      'respondidos',    COALESCE(agg.respondidos, 0),
      'adiados',        COALESCE(agg.adiados, 0),
      'nao_realizados', COALESCE(agg.nao_realizados, 0),
      'tem_pendencia',  COALESCE(agg.total_itens, 0) > COALESCE(agg.respondidos, 0)
    )

  )
  INTO v_resultado
  FROM public.formularios f
  LEFT JOIN public.alunos   a  ON a.id  = f.aluno_id
  LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id

  -- ── Agregação lateral otimizada ─────────────────────────────────
  -- Esta subquery substitui as duas subqueries anteriores:
  --   1. a subquery de "itens"
  --   2. a subquery de "resumo_pendencias"
  --
  -- O LEFT JOIN LATERAL é usado para:
  --   • manter o retorno do formulário mesmo se, por algum motivo,
  --     a agregação não encontrar linhas;
  --   • permitir que a subquery use p_formulario_id e v_template_id;
  --   • calcular array e contadores em uma única passagem.
  LEFT JOIN LATERAL (
    SELECT
      -- Array completo de itens da prova.
      -- COALESCE garante [] quando não houver perguntas no template.
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            -- Metadados estruturais da pergunta (extraídos do template)
            'pergunta_id',  pq.id,
            'texto',        pq.texto_pergunta,
            'ordem',        pq.ordem,
            'obrigatoria',  pq.obrigatoria,

            -- Metadados clínicos do MABC-2 armazenados na coluna opcoes
            'componente',   pq.opcoes->>'componente',
            'codigo_item',  pq.opcoes->>'codigo_item',
            'sub_item',     pq.opcoes->>'sub_item',
            'unidade',      pq.opcoes->>'unidade',

            -- Dados da resposta (NULL quando item ainda não foi tocado)
            'resposta_id',  rf.id,
            'status_item',  rf.status_item::TEXT,

            -- Cast numérico do escore bruto; NULL para itens adiados/não realizados
            'escore_bruto', rf.valor_preenchido::NUMERIC,

            -- Nível de ajuda e complementos extraídos da coluna JSONB valor_ajuda
            'nivel_ajuda',  rf.valor_ajuda->>'nivel',
            'complementos', rf.valor_ajuda->'complementos'
          )
          ORDER BY pq.ordem
        ),
        '[]'::JSONB
      ) AS itens,

      -- Totais matemáticos calculados na mesma varredura usada para itens.
      COUNT(pq.id) AS total_itens,

      COUNT(rf.id) FILTER (
        WHERE rf.status_item = 'respondido'
      ) AS respondidos,

      COUNT(rf.id) FILTER (
        WHERE rf.status_item = 'adiado'
      ) AS adiados,

      COUNT(rf.id) FILTER (
        WHERE rf.status_item = 'nao_realizado'
      ) AS nao_realizados

    FROM public.perguntas pq
    LEFT JOIN public.respostas_formulario rf
           ON rf.pergunta_id   = pq.id
          AND rf.formulario_id = p_formulario_id  -- filtra pela INSTÂNCIA
    WHERE pq.formulario_id = v_template_id        -- itera o TEMPLATE
  ) agg ON TRUE

  WHERE f.id = p_formulario_id;

  RETURN v_resultado;
END;
$$;


-- ════════════════════════════════════════════════════════════════════
-- Índice de apoio para rpc_get_historico_mabc2_aluno
-- ════════════════════════════════════════════════════════════════════
-- Cobre exatamente os predicados do WHERE (aluno_id, tipo, protegido)
-- e a ordenação (created_at DESC), eliminando seq scan e sort externo.
-- ════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_formularios_mabc2_aluno
  ON public.formularios (aluno_id, tipo, protegido, created_at DESC);


-- ════════════════════════════════════════════════════════════════════
-- RPC: rpc_get_historico_mabc2_aluno
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: retornar um array JSONB com todas as avaliações MABC-2 de
-- um aluno, ordenadas da mais recente para a mais antiga, com a flag
-- tem_pendencia já calculada para cada bateria.
--
-- Estratégia de tem_pendencia:
--   EXISTS termina na primeira ocorrência, sem agregações custosas.
--   A subquery cruza as perguntas obrigatórias do template com as
--   respostas da instância: se alguma estiver sem resposta (rf.id IS NULL)
--   ou com status 'adiado', a flag retorna TRUE.
--
-- Filtros aplicados:
--   • aluno_id = p_aluno_id   → apenas formulários do aluno solicitado
--   • tipo = 'mabc2'          → apenas baterias MABC-2
--   • protegido = FALSE       → apenas instâncias aplicadas (não templates)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_historico_mabc2_aluno(
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',                 f.id,
        'titulo',             f.titulo,
        'created_at',         f.created_at,
        'updated_at',         f.updated_at,
        'metadados',          f.metadados,
        'template_origem_id', f.template_origem_id,
        'avaliador_id',       f.avaliador_id,

        -- ── tem_pendencia via EXISTS ──────────────────────────────
        -- Verifica se existe alguma pergunta obrigatória do template
        -- que: (a) não possui resposta na instância (rf.id IS NULL),
        --   ou (b) possui resposta com status = 'adiado'.
        -- EXISTS interrompe a varredura na 1ª linha encontrada,
        -- tornando esta lógica eficiente mesmo em baterias grandes.
        'tem_pendencia', EXISTS (
          SELECT 1
          FROM   public.perguntas pq
          LEFT JOIN public.respostas_formulario rf
                 ON rf.pergunta_id   = pq.id
                AND rf.formulario_id = f.id
          WHERE  pq.formulario_id = f.template_origem_id
            AND  pq.obrigatoria   = TRUE
            AND  (rf.id IS NULL OR rf.status_item = 'adiado')
        )
      )
      ORDER BY f.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO  v_resultado
  FROM  public.formularios f
  WHERE f.aluno_id  = p_aluno_id
    AND f.tipo      = 'mabc2'
    AND f.protegido = FALSE;

  RETURN v_resultado;
END;
$$;
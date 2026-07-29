-- ════════════════════════════════════════════════════════════════════
-- unificar listar_formularios_aluno e pendentes
-- ════════════════════════════════════════════════════════════════════
-- Esta migração consolida tudo em listar_formularios_aluno, que passa a
-- retornar TODOS os formulários ATIVOS do aluno (qualquer tipo) com a flag
-- `pendente` calculada na mesma consulta. Cada consumidor filtra o que precisa:
--   • use-student-sessions  → usa apenas tipo IN ('ata','cars');
--   • session-start-guard   → usa as linhas com pendente = true (por tipo).
--
-- Regras preservadas:
--   • Apenas formulários ativos (ativo = true) — "removidos" somem do histórico.
--   • Instâncias vinculadas a uma sessão CANCELADA são desconsideradas (cobre
--     o Registro de Controle de sessões canceladas).
--   • Modelo de instância: as perguntas vivem no template (template_origem_id),
--     então resolvemos com COALESCE(template_origem_id, id); as respostas são
--     ligadas à instância (respostas_formulario.formulario_id).
--   • `pendente` = existe ≥1 pergunta obrigatória do template sem resposta.
--   • `tem_respostas`/`total_respostas`/`ultima_resposta_em` usam o vínculo
--     aluno_id + formulario_id (relevante para ATA/CARS no histórico).
-- ════════════════════════════════════════════════════════════════════

-- A assinatura muda (nova coluna `pendente`), então é preciso recriar.
DROP FUNCTION IF EXISTS public.listar_formularios_aluno(UUID);

CREATE FUNCTION public.listar_formularios_aluno(
  p_aluno_id UUID
)
RETURNS TABLE (
  id                 UUID,
  titulo             TEXT,
  tipo               tipo_formulario,
  ativo              BOOLEAN,
  created_at         TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ,
  tem_respostas      BOOLEAN,
  total_respostas    BIGINT,
  ultima_resposta_em TIMESTAMPTZ,
  pendente           BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.titulo,
    f.tipo,
    f.ativo,
    f.created_at,
    f.updated_at,
    COUNT(rf.id) > 0      AS tem_respostas,
    COUNT(rf.id)          AS total_respostas,
    MAX(rf.atualizado_em) AS ultima_resposta_em,
    EXISTS (
      SELECT 1
      FROM public.perguntas p
      LEFT JOIN public.respostas_formulario r
        ON r.pergunta_id   = p.id
       AND r.formulario_id = f.id
      WHERE p.formulario_id = COALESCE(f.template_origem_id, f.id)
        AND p.obrigatoria   = true
        AND r.id IS NULL
    )                     AS pendente
  FROM public.formularios f
  LEFT JOIN public.respostas_formulario rf
         ON rf.aluno_id      = p_aluno_id
        AND rf.formulario_id = f.id
  WHERE f.aluno_id = p_aluno_id
    AND f.ativo    = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.sessoes s
      WHERE s.formulario_id = f.id
        AND s.status = 'cancelada'
    )
  -- f.id é PK, então agrupar por ela permite selecionar as demais colunas de f.
  GROUP BY f.id
  ORDER BY f.tipo ASC, f.created_at DESC;
$$;

-- ════════════════════════════════════════════════════════════════════
-- Histórico MABC-2 do aluno: também ignora formulários inativos.
-- ════════════════════════════════════════════════════════════════════
-- As avaliações MABC-2 vêm por uma RPC própria (retorna JSONB); ao "remover"
-- uma avaliação marcamos ativo = false, então ela deve sumir do histórico
-- assim como ATA/CARS — mesmo critério das sessões canceladas.

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
    AND f.protegido = FALSE
    AND f.ativo     = true;

  RETURN v_resultado;
END;
$$;

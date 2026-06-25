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
        ON rf.formulario_id = f.id
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

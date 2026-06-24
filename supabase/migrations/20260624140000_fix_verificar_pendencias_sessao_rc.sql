-- ════════════════════════════════════════════════════════════════════
-- Correção: verificar_pendencias_sessao detecta pendência do RC corretamente
-- ════════════════════════════════════════════════════════════════════
-- Bug: a checagem das perguntas obrigatórias do RC fazia JOIN das perguntas em
-- s.formulario_id (a INSTÂNCIA do RC), mas as perguntas vivem no TEMPLATE
-- (template_origem_id). Logo, nenhuma pergunta era encontrada e a pendência do
-- RC nunca era detectada — só a de execuções.
--
-- Correção:
--   • resolve o template via COALESCE(f.template_origem_id, f.id);
--   • considera pendente quando não há resposta preenchida (sem linha OU com
--     valor vazio — caso de salvamento parcial do RC durante a sessão).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.verificar_pendencias_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exercicios_pendentes JSONB;
  v_perguntas_pendentes JSONB;
  v_resultado JSONB;
BEGIN
  -- 1. Execuções pendentes: iniciadas, não marcadas como "não realizada",
  --    mas sem o resultado da atividade (nível/registro de ajuda).
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('exercicio_id', ex.exercicio_id)
         ), '[]'::jsonb)
  INTO v_exercicios_pendentes
  FROM public.execucoes_exercicio ex
  WHERE ex.sessao_id = p_sessao_id
    AND ex.status_realizacao IS DISTINCT FROM 'nao_realizada'
    AND (ex.nivel_desenvolvimento IS NULL OR ex.registro_ajuda IS NULL);

  -- 2. Perguntas obrigatórias do RC sem resposta preenchida.
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('pergunta_id', p.id, 'ordem', p.ordem)
         ), '[]'::jsonb)
  INTO v_perguntas_pendentes
  FROM public.sessoes s
  JOIN public.formularios f ON f.id = s.formulario_id
  JOIN public.perguntas p ON p.formulario_id = COALESCE(f.template_origem_id, f.id)
  WHERE s.id = p_sessao_id
    AND p.obrigatoria = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.respostas_formulario rf
      WHERE rf.pergunta_id = p.id
        AND rf.sessao_id = p_sessao_id
        AND rf.valor_preenchido IS NOT NULL
        AND btrim(rf.valor_preenchido) <> ''
    );

  v_resultado := jsonb_build_object(
    'tem_pendencias', (
      jsonb_array_length(v_exercicios_pendentes) > 0
      OR jsonb_array_length(v_perguntas_pendentes) > 0
    ),
    'exercicios_pendentes', v_exercicios_pendentes,
    'perguntas_pendentes', v_perguntas_pendentes
  );

  RETURN v_resultado;
END;
$$;

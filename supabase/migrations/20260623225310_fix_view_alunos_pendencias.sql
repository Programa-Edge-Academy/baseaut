-- ════════════════════════════════════════════════════════════════════
-- Correção: View de pendências (Filtro de adiados e validade de formulário)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_alunos_pendencias WITH (security_invoker = true) AS
WITH adiados AS (
  SELECT DISTINCT s.aluno_id
  FROM public.sessoes s
  JOIN public.execucoes_exercicio ee ON ee.sessao_id = s.id
  LEFT JOIN public.formularios f ON f.id = s.formulario_id
  WHERE s.status <> 'cancelada'
    AND ee.status_realizacao = 'adiado'
    AND (f.id IS NULL OR f.ativo = true) -- Trava de validade do formulário
),
forms_pendentes AS (
  SELECT DISTINCT f.aluno_id
  FROM public.formularios f
  WHERE f.ativo = true
    AND f.aluno_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.perguntas p
      LEFT JOIN public.respostas_formulario r ON r.pergunta_id = p.id AND r.formulario_id = f.id
      WHERE p.formulario_id = COALESCE(f.template_origem_id, f.id)
        AND p.obrigatoria = true
        AND (r.id IS NULL OR r.status_item = 'adiado')
    )
)
SELECT
  a.id AS aluno_id,
  (ad.aluno_id IS NOT NULL OR fp.aluno_id IS NOT NULL) AS tem_pendencia
FROM public.alunos a
LEFT JOIN adiados ad         ON ad.aluno_id = a.id
LEFT JOIN forms_pendentes fp ON fp.aluno_id = a.id;
-- ════════════════════════════════════════════════════════════════════
-- Otimização: vw_alunos_pendencias (corrigir statement timeout 57014)
-- ════════════════════════════════════════════════════════════════════
-- A versão anterior calculava `tem_pendencia` com duas subconsultas EXISTS
-- correlacionadas por aluno — o planner caía em nested-loops por aluno e a
-- view (consultada para TODOS os alunos de uma vez) estourava o timeout.
--
-- Reescrita em duas CTEs que materializam, UMA única vez, o conjunto de alunos:
--   • com algum exercício 'adiado' em sessão não cancelada;
--   • com algum formulário ativo contendo obrigatória sem resposta.
-- Em seguida, LEFT JOIN dessas CTEs em `alunos` (hash joins, sem correlação).
--
-- Também trocamos o anti-join "LEFT JOIN ... WHERE r.id IS NULL" por NOT EXISTS,
-- e adicionamos os índices que faltavam para os predicados usados aqui.
-- A semântica e as colunas (aluno_id, tem_pendencia) são idênticas às anteriores.
-- ════════════════════════════════════════════════════════════════════

-- ── Índices de apoio ────────────────────────────────────────────────

-- Localiza rapidamente execuções adiadas por sessão (CTE de adiados).
CREATE INDEX IF NOT EXISTS idx_execucoes_adiado
  ON public.execucoes_exercicio (sessao_id)
  WHERE status_realizacao = 'adiado';

-- Suporta o NOT EXISTS de "resposta da pergunta nesta instância".
CREATE INDEX IF NOT EXISTS idx_respostas_formulario_pergunta
  ON public.respostas_formulario (formulario_id, pergunta_id);

-- Suporta a varredura de perguntas obrigatórias por template/instância.
CREATE INDEX IF NOT EXISTS idx_perguntas_obrigatorias
  ON public.perguntas (formulario_id)
  WHERE obrigatoria = true;

-- Suporta o NOT EXISTS de "instância vinculada a sessão cancelada".
CREATE INDEX IF NOT EXISTS idx_sessoes_formulario_cancelada
  ON public.sessoes (formulario_id)
  WHERE status = 'cancelada';

-- ── View reescrita ──────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.vw_alunos_pendencias WITH (security_invoker = true) AS
WITH adiados AS (
  -- Alunos com exercício adiado em sessão não cancelada.
  SELECT DISTINCT s.aluno_id
  FROM public.sessoes s
  JOIN public.execucoes_exercicio ee
    ON ee.sessao_id = s.id
  WHERE s.status <> 'cancelada'
    AND ee.status_realizacao = 'adiado'
),
forms_pendentes AS (
  -- Alunos com formulário ativo (RC, ATA, CARS, MABC) com obrigatória sem resposta.
  SELECT DISTINCT f.aluno_id
  FROM public.formularios f
  WHERE f.ativo = true
    AND f.aluno_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.perguntas p
      WHERE p.formulario_id = COALESCE(f.template_origem_id, f.id)
        AND p.obrigatoria = true
        AND NOT EXISTS (
          SELECT 1
          FROM public.respostas_formulario r
          WHERE r.formulario_id = f.id
            AND r.pergunta_id = p.id
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.sessoes s2
      WHERE s2.formulario_id = f.id
        AND s2.status = 'cancelada'
    )
)
SELECT
  a.id AS aluno_id,
  (ad.aluno_id IS NOT NULL OR fp.aluno_id IS NOT NULL) AS tem_pendencia
FROM public.alunos a
LEFT JOIN adiados ad         ON ad.aluno_id = a.id
LEFT JOIN forms_pendentes fp ON fp.aluno_id = a.id;

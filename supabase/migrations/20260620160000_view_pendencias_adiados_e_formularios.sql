-- ════════════════════════════════════════════════════════════════════
-- Pendências: exercícios adiados OU formulários com obrigatórias sem resposta
-- ════════════════════════════════════════════════════════════════════
-- Considera pendência quando:
--   1. Existe uma sessão não cancelada do aluno com algum exercício 'adiado'
--      (verificado direto em execucoes_exercicio por sessao_id — inclui também
--      exercícios fora do circuito e atividades de engajamento).
--   2. Existe um formulário ATIVO do aluno (Registro de Controle, ATA, CARS ou
--      MABC) com pelo menos uma pergunta obrigatória sem resposta.
--
-- Modelo de instância: as instâncias de formulário não copiam as perguntas —
-- elas apontam para o template via template_origem_id. Por isso resolvemos as
-- perguntas com COALESCE(template_origem_id, id). As respostas são vinculadas à
-- instância (respostas_formulario.formulario_id), o que cobre RC, ATA, CARS e
-- MABC de forma uniforme.
--
-- Um RC pertencente a uma sessão cancelada é desconsiderado.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_alunos_pendencias WITH (security_invoker = true) AS
SELECT
  a.id AS aluno_id,
  (
    -- 1. Sessão não cancelada com algum exercício adiado.
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.execucoes_exercicio ee
        ON ee.sessao_id = s.id
      WHERE s.aluno_id = a.id
        AND s.status <> 'cancelada'
        AND ee.status_realizacao = 'adiado'
    )
    OR
    -- 2. Formulário ativo (RC, ATA, CARS, MABC) com obrigatória sem resposta.
    EXISTS (
      SELECT 1
      FROM public.formularios f
      JOIN public.perguntas p
        ON p.formulario_id = COALESCE(f.template_origem_id, f.id)
      LEFT JOIN public.respostas_formulario r
        ON r.pergunta_id = p.id
       AND r.formulario_id = f.id
      WHERE f.aluno_id = a.id
        AND f.ativo = true
        AND p.obrigatoria = true
        AND r.id IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.sessoes s2
          WHERE s2.formulario_id = f.id
            AND s2.status = 'cancelada'
        )
    )
  ) AS tem_pendencia
FROM public.alunos a;

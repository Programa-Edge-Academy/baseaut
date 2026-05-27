-- Criação da View com Security Invoker para respeitar as regras de RLS do usuário logado
CREATE OR REPLACE VIEW public.vw_alunos_pendencias WITH (security_invoker = true) AS
SELECT 
  a.id AS aluno_id,
  EXISTS (
    SELECT 1
    FROM public.sessoes s
    WHERE s.aluno_id = a.id
    AND (
      -- Condição 1: Tem algum exercício pendente na sessão?
      EXISTS (
        SELECT 1
        FROM public.circuitos_exercicios ce
        LEFT JOIN public.execucoes_exercicio ee 
               ON ee.exercicio_id = ce.exercicio_id 
              AND ee.sessao_id = s.id
        WHERE ce.circuito_id = s.circuito_id
          AND (ee.id IS NULL OR ee.status = 'nao_realizada')
      )
      OR
      -- Condição 2: Tem alguma pergunta obrigatória sem resposta na sessão?
      EXISTS (
        SELECT 1
        FROM public.perguntas p
        LEFT JOIN public.respostas r 
               ON r.pergunta_id = p.id 
              AND r.sessao_id = s.id
        WHERE p.formulario_id = s.formulario_id
          AND p.obrigatoria = true
          AND r.id IS NULL
      )
    )
  ) AS tem_pendencia
FROM public.alunos a;
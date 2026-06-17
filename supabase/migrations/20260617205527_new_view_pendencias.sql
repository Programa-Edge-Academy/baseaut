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
        FROM public.itens_circuito ic
        LEFT JOIN public.execucoes_exercicio ee 
               ON ee.exercicio_id = ic.exercicio_id 
              AND ee.sessao_id = s.id
        WHERE ic.circuito_id = s.circuito_id
          AND (
            -- 1. O exercício sumiu/nunca foi avaliado de fato
            ee.id IS NULL 
            
            -- 2. O terapeuta usou o botão de Adiar
            OR ee.status_realizacao = 'adiado'
            
            -- 3. O terapeuta disse que realizou, mas não preencheu as notas
            OR (ee.status_realizacao = 'realizada' AND (ee.nivel_desenvolvimento IS NULL OR ee.registro_ajuda IS NULL))
          )
      )
      OR
      -- Condição 2: Tem alguma pergunta obrigatória sem resposta na sessão?
      EXISTS (
        SELECT 1
        FROM public.perguntas p
        LEFT JOIN public.respostas_formulario r 
               ON r.pergunta_id = p.id 
              AND r.sessao_id = s.id
        WHERE p.formulario_id = s.formulario_id
          AND p.obrigatoria = true
          AND r.id IS NULL
      )
    )
  ) AS tem_pendencia
FROM public.alunos a;
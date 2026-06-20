-- ════════════════════════════════════════════════════════════════════
-- [DESATUALIZADO] Simplifica view de pendências
-- ════════════════════════════════════════════════════════════════════
-- A view antiga (vw_alunos_pendencias) marcava falhas de registro como 
-- pendência (ex: exercícios marcados como realizados, mas sem
-- preenchimento de nível de desenvolvimento/ajuda).
--
-- Atualmente, a própria interface do aplicativo já impede que um exercício
-- seja marcado como "realizada" sem as suas respectivas avaliações
-- preenchidas. (Sessões finalizadas precocemente que não geram registro de
-- não realização serão tratadas em ajustes futuros).
--
-- Atualizamos a view para considerar exclusivamente o status 'adiado',
-- desconsiderando sessões canceladas. A checagem é feita direto em
-- execucoes_exercicio por sessao_id (sem JOIN com itens_circuito), de modo a
-- incluir também exercícios realizados fora do circuito na mesma sessão
-- ("realizar outro exercício") e atividades de engajamento.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_alunos_pendencias WITH (security_invoker = true) AS
SELECT 
  a.id AS aluno_id,
  EXISTS (
    SELECT 1
    FROM public.sessoes s
    JOIN public.execucoes_exercicio ee
      ON ee.sessao_id = s.id
    WHERE s.aluno_id = a.id
      AND s.status <> 'cancelada'
      AND ee.status_realizacao = 'adiado'
  ) AS tem_pendencia
FROM public.alunos a;

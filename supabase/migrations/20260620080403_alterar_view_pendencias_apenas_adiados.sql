-- ════════════════════════════════════════════════════════════════════
-- Simplifica a view de pendências para exibir apenas exercícios adiados
-- ════════════════════════════════════════════════════════════════════
-- A view antiga (vw_alunos_pendencias) marcava falhas de registro como 
-- pendência (ex: formulários sem resposta ou exercícios marcados como
-- realizados, mas sem preenchimento de nível de desenvolvimento/ajuda).
--
-- Atualmente, a própria interface do aplicativo já bloqueia o envio de 
-- formulários com campos vazios e impede que um exercício seja marcado 
-- como "realizada" sem as suas respectivas avaliações preenchidas. 
-- (Sessões finalizadas precocemente que não geram registro de não 
-- realização serão tratadas em ajustes futuros).
--
-- Dessa forma, as travas de formulário obsoleceram a verificação de erros 
-- pela view, sobrando apenas um único motivo real e legítimo para acusar 
-- uma pendência no sistema: quando o terapeuta clica ativamente em "Adiar".
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
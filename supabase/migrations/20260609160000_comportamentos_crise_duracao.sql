-- ================================================================
-- Botão de crise: duração do episódio em comportamentos_sessao
-- ================================================================
-- A US do botão de crise exige registrar a DURAÇÃO de cada episódio de
-- crise, vinculada ao exercício (execucao_id) e à sessão, para alimentar a
-- US10.5.5 (comparar comportamentos observados). A tabela comportamentos_sessao
-- ainda não possuía coluna de duração.
-- ================================================================

ALTER TABLE public.comportamentos_sessao
  ADD COLUMN IF NOT EXISTS duracao_segundos INTEGER
    CHECK (duracao_segundos IS NULL OR duracao_segundos >= 0);

-- Alinha a escrita com as demais tabelas da sessão (execucoes/respostas):
-- o responsável operacional da sessão (monitor membro OU coordenador) pode
-- registrar comportamentos. Substitui a policy restrita a is_team_member.
DROP POLICY IF EXISTS "comportamentos_equipe" ON public.comportamentos_sessao;
DROP POLICY IF EXISTS "comportamentos_sessao: select team" ON public.comportamentos_sessao;
DROP POLICY IF EXISTS "comportamentos_sessao: write session owner" ON public.comportamentos_sessao;]

ALTER TABLE public.comportamentos_sessao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comportamentos_sessao: select_equipe"
  ON public.comportamentos_sessao
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = sessao_id
        AND public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "comportamentos_sessao: modificacao_autorizada"
  ON public.comportamentos_sessao
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = sessao_id
        AND (s.monitor_id = auth.uid() OR public.can_access_team(a.equipe_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = sessao_id
        AND (s.monitor_id = auth.uid() OR public.can_access_team(a.equipe_id))
    )
  );

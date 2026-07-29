-- ================================================================
-- 19. RELATORIOS
-- Regra:
--   SELECT → membros/coordenador da equipe do aluno.
--   INSERT/UPDATE/DELETE → somente coordenador responsável pela equipe do aluno
--                           e autor do relatório.
--
-- Alteração: a policy anterior validava created_by, mas não validava se o
-- aluno do relatório pertencia à equipe do coordenador. Agora valida ambos.
-- ================================================================

CREATE POLICY "relatorios: team members read"
  ON public.relatorios
  FOR SELECT
  USING (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "relatorios: coordinator manages"
  ON public.relatorios
  FOR ALL
  USING (
    public.is_coordinator()
    AND created_by = auth.uid()
    AND aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.is_team_coordinator(a.equipe_id)
    )
  )
  WITH CHECK (
    public.is_coordinator()
    AND created_by = auth.uid()
    AND aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.is_team_coordinator(a.equipe_id)
    )
  );

-- Justificativa: Monitor tem relatorio:visualizar, não relatorio:exportar.
-- Coordenador gera/exporta relatórios apenas dos alunos da própria equipe.


-- ================================================================
-- 20. SECOES_RELATORIO
-- Regra:
--   SELECT → quem pode ler o relatório pode ler as seções.
--   INSERT/UPDATE/DELETE → somente coordenador que gerencia o relatório.
--
-- Alteração: a policy antiga FOR ALL via relatorio_id IN (SELECT relatorios)
-- permitia escrita por quem apenas podia ler o relatório. Agora separa leitura
-- e gestão.
-- ================================================================

CREATE POLICY "secoes: select via relatorio"
  ON public.secoes_relatorio
  FOR SELECT
  USING (
    relatorio_id IN (SELECT r.id FROM public.relatorios r)
  );

CREATE POLICY "secoes: manage via own relatorio"
  ON public.secoes_relatorio
  FOR ALL
  USING (
    relatorio_id IN (
      SELECT r.id
      FROM public.relatorios r
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE r.created_by = auth.uid()
        AND public.is_team_coordinator(a.equipe_id)
    )
  )
  WITH CHECK (
    relatorio_id IN (
      SELECT r.id
      FROM public.relatorios r
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE r.created_by = auth.uid()
        AND public.is_team_coordinator(a.equipe_id)
    )
  );

-- Justificativa: seções são parte editável do relatório, mas só pelo
-- coordenador autor e responsável pela equipe do aluno.


-- ================================================================
-- 21. MIDIAS
-- Regra:
--   SELECT → quem pode ler a seção/relatório pode ler as mídias.
--   INSERT/UPDATE/DELETE → somente coordenador que gerencia o relatório pai.
--
-- Alteração: separa leitura e gestão, evitando que Monitor com leitura de
-- relatório faça upload/alteração de mídias vinculadas ao relatório.
-- ================================================================

CREATE POLICY "midias: select via secao"
  ON public.midias
  FOR SELECT
  USING (
    secao_id IN (SELECT sr.id FROM public.secoes_relatorio sr)
  );

CREATE POLICY "midias: manage via own relatorio"
  ON public.midias
  FOR ALL
  USING (
    secao_id IN (
      SELECT sr.id
      FROM public.secoes_relatorio sr
      JOIN public.relatorios r ON r.id = sr.relatorio_id
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE r.created_by = auth.uid()
        AND public.is_team_coordinator(a.equipe_id)
    )
  )
  WITH CHECK (
    secao_id IN (
      SELECT sr.id
      FROM public.secoes_relatorio sr
      JOIN public.relatorios r ON r.id = sr.relatorio_id
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE r.created_by = auth.uid()
        AND public.is_team_coordinator(a.equipe_id)
    )
  );

-- Justificativa: mídias são anexos de relatório. A leitura acompanha o relatório;
-- a escrita fica restrita ao coordenador que gerencia o documento.
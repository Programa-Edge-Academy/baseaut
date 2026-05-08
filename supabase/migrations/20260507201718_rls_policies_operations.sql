-- ================================================================
-- RLS POLICIES - TABELAS OPERACIONAIS
-- US 2.4 e 2.5: Ninguém vê dados de equipe concorrente
-- ================================================================


-- ----------------------------------------------------------------
-- ALUNOS
-- Só membros da equipe veem.
-- Só Coordenador pode criar e editar.
-- ----------------------------------------------------------------

CREATE POLICY "alunos_select_team_member" ON public.alunos
  FOR SELECT
  USING (public.is_team_member(equipe_id));

CREATE POLICY "alunos_insert_coordinator" ON public.alunos
  FOR INSERT
  WITH CHECK (public.is_coordinator());

CREATE POLICY "alunos_update_coordinator" ON public.alunos
  FOR UPDATE
  USING (public.is_coordinator() AND public.is_team_member(equipe_id))
  WITH CHECK (public.is_coordinator());


-- ----------------------------------------------------------------
-- EXERCICIOS
-- Qualquer membro da equipe pode ver e gerenciar.
-- ----------------------------------------------------------------

CREATE POLICY "exercicios_select_team" ON public.exercicios
  FOR SELECT
  USING (public.is_team_member(equipe_id));

CREATE POLICY "exercicios_write_team" ON public.exercicios
  FOR ALL
  USING (public.is_team_member(equipe_id));


-- ----------------------------------------------------------------
-- CIRCUITOS
-- Qualquer membro da equipe pode ver e gerenciar.
-- ----------------------------------------------------------------

CREATE POLICY "circuitos_select_team" ON public.circuitos
  FOR SELECT
  USING (public.is_team_member(equipe_id));

CREATE POLICY "circuitos_write_team" ON public.circuitos
  FOR ALL
  USING (public.is_team_member(equipe_id));


-- ----------------------------------------------------------------
-- SESSOES
-- Monitor vê apenas as próprias sessões.
-- Coordenador vê todas as sessões da equipe.
-- Apenas Monitor cria e edita sessões.
-- ----------------------------------------------------------------

CREATE POLICY "sessoes_monitor_select_own" ON public.sessoes
  FOR SELECT
  USING (
    monitor_id = auth.uid()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'monitor'
  );

CREATE POLICY "sessoes_coordinator_select_all" ON public.sessoes
  FOR SELECT
  USING (
    public.is_coordinator()
    AND aluno_id IN (
      SELECT id FROM public.alunos
      WHERE public.is_team_member(equipe_id)
    )
  );

CREATE POLICY "sessoes_monitor_insert" ON public.sessoes
  FOR INSERT
  WITH CHECK (monitor_id = auth.uid());

CREATE POLICY "sessoes_monitor_update_own" ON public.sessoes
  FOR UPDATE
  USING (monitor_id = auth.uid())
  WITH CHECK (monitor_id = auth.uid());
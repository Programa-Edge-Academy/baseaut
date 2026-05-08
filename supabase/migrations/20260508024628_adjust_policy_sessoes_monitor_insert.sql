DROP POLICY IF EXISTS "sessoes_monitor_insert" ON public.sessoes;

CREATE POLICY "sessoes_monitor_insert" ON public.sessoes
  FOR INSERT
  WITH CHECK (
    monitor_id = auth.uid()
    AND public.is_team_member(equipe_id)
);
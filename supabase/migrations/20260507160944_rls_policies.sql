-- 20260501_000027_rls_policies.sql


-- ════════ PROFILES ══════════════════════════════════════════════════
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT USING (id = auth.uid());


CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ════════ EQUIPES ════════════════════════════════════════════════════
CREATE POLICY "equipes: select member"
  ON public.equipes FOR SELECT USING (public.is_team_member(id));


CREATE POLICY "equipes: insert coordinator"
  ON public.equipes FOR INSERT WITH CHECK (public.is_coordinator());


CREATE POLICY "equipes: update coordinator"
  ON public.equipes FOR UPDATE
  USING (public.is_coordinator() AND public.is_team_member(id));


-- ════════ MEMBROS EQUIPE ═════════════════════════════════════════════
CREATE POLICY "membros: select same team"
  ON public.membros_equipe FOR SELECT
  USING (equipe_id IN (SELECT equipe_id FROM public.membros_equipe WHERE usuario_id = auth.uid()));


CREATE POLICY "membros: manage coordinator"
  ON public.membros_equipe FOR ALL USING (public.is_coordinator());

-- ================================================================
-- 5. EQUIPES
-- Regra:
--   SELECT → membros ativos ou coordenador responsável pela equipe.
--   INSERT → coordenador cria apenas equipe onde ele mesmo é coordenador_id.
--   UPDATE → somente coordenador responsável pela equipe.
--   DELETE → sem policy; exclusão fica bloqueada por ausência de permissão RLS.
--
-- Alteração: o INSERT agora exige coordenador_id = auth.uid(). O arquivo
-- anterior aceitava qualquer coordenador_id, permitindo criar equipe em nome
-- de outro usuário.
-- ================================================================

CREATE POLICY "equipes: select member"
  ON public.equipes
  FOR SELECT
  USING (public.can_access_team(id));

CREATE POLICY "equipes: insert coordinator"
  ON public.equipes
  FOR INSERT
  WITH CHECK (
    public.is_coordinator()
    AND coordenador_id = auth.uid()
  );

CREATE POLICY "equipes: update coordinator"
  ON public.equipes
  FOR UPDATE
  USING (public.is_team_coordinator(id))
  WITH CHECK (
    public.is_team_coordinator(id)
    AND coordenador_id = auth.uid()
  );

-- Justificativa: impede que um coordenador altere ou assuma equipe de outro
-- coordenador. Mantém isolamento entre equipes concorrentes.

-- ================================================================
-- 6. MEMBROS_EQUIPE
-- Regra:
--   SELECT → membro/coordenador vê membros da própria equipe.
--   INSERT/UPDATE/DELETE → somente coordenador responsável pela equipe.
--
-- Alteração: a policy antiga usava subquery direta em membros_equipe dentro
-- da própria policy e a policy de gerenciamento aceitava qualquer coordenador.
-- Esta versão usa can_access_team/is_team_coordinator para evitar recursão e
-- bloquear gestão de equipes alheias.
-- ================================================================

CREATE POLICY "membros: select same team"
  ON public.membros_equipe
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "membros: manage coordinator"
  ON public.membros_equipe
  FOR ALL
  USING (public.is_team_coordinator(equipe_id))
  WITH CHECK (public.is_team_coordinator(equipe_id));

-- Justificativa: Monitor pode visualizar quem pertence à sua equipe, mas não
-- pode adicionar/remover pessoas. Coordenador só gerencia a própria equipe.

-- ================================================================
-- 8. ALUNOS
-- Regra:
--   SELECT → membros/coordenador da equipe do aluno.
--   INSERT → somente coordenador responsável pela equipe.
--   UPDATE → somente coordenador responsável pela equipe.
--   DELETE → sem policy; histórico clínico/sessões deve ser preservado.
--
-- Alteração: o INSERT antigo só exigia is_coordinator(), permitindo cadastrar
-- aluno em qualquer equipe conhecida. Agora exige is_team_coordinator(equipe_id).
-- ================================================================

CREATE POLICY "alunos: select team member"
  ON public.alunos
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "alunos: insert coordinator"
  ON public.alunos
  FOR INSERT
  WITH CHECK (
    public.is_coordinator()
    AND public.is_team_coordinator(equipe_id)
  );

CREATE POLICY "alunos: update coordinator"
  ON public.alunos
  FOR UPDATE
  USING (
    public.is_coordinator()
    AND public.is_team_coordinator(equipe_id)
  )
  WITH CHECK (
    public.is_coordinator()
    AND public.is_team_coordinator(equipe_id)
  );

-- Justificativa: aluno nunca faz login e pertence a uma equipe. O isolamento
-- por equipe é obrigatório para dados clínicos e de acompanhamento.

-- ================================================================
-- 9. AVALIACOES (MABC)
-- Regra:
--   SELECT → membros ativos/coordenador da equipe do aluno.
--   INSERT → membros ativos/coordenador da equipe do aluno.
--   UPDATE → membros ativos/coordenador da equipe do aluno.
--   DELETE → sem policy; histórico clínico deve ser preservado.
--
-- Justificativa:
--   Avaliações MABC são dados clínicos vinculados ao aluno, porém,
--   pela regra de negócio atual, monitores também participam das
--   avaliações e precisam registrar/editar esses dados.
--
--   Como a tabela avaliacoes do schema atual não possui coluna created_by,
--   a autoria não é validada por RLS nesta policy.
--
--   A restrição de segurança fica baseada no aluno avaliado:
--   o usuário só pode registrar/editar avaliação se tiver acesso ativo
--   à equipe do aluno.
--
--   O UPDATE valida:
--     1. a linha atual, via USING;
--     2. o novo estado da linha, via WITH CHECK.
--
--   Não há policy de DELETE para preservar o histórico clínico.
-- ================================================================

CREATE POLICY "avaliacoes: select team member"
  ON public.avaliacoes
  FOR SELECT
  USING (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "avaliacoes: insert team member"
  ON public.avaliacoes
  FOR INSERT
  WITH CHECK (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "avaliacoes: update team member"
  ON public.avaliacoes
  FOR UPDATE
  USING (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.can_access_team(a.equipe_id)
    )
  );
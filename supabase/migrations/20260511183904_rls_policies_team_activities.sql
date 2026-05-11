-- ================================================================
-- 10. FORMULARIOS
-- Regra: membros ativos/coordenador da equipe podem ver e gerenciar.
-- Permissão do Roadmap: formulario:gerenciar concedida ao Monitor.
-- ================================================================

CREATE POLICY "formularios: select team"
  ON public.formularios
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "formularios: write team"
  ON public.formularios
  FOR ALL
  USING (public.can_access_team(equipe_id))
  WITH CHECK (public.can_access_team(equipe_id));

-- Justificativa: formulários são material operacional da equipe e podem ser
-- gerenciados por monitores conforme seed de permissões do Roadmap.
-- A RLS valida a equipe; a atribuição created_by deve ser preenchida pelo app
-- com auth.uid() ou por trigger, sem bloquear colaboração entre membros.

-- ================================================================
-- 11. PERGUNTAS
-- Regra: acesso herdado do formulário pai.
-- ================================================================

CREATE POLICY "perguntas: via formulario"
  ON public.perguntas
  FOR ALL
  USING (
    formulario_id IN (
      SELECT f.id
      FROM public.formularios f
      WHERE public.can_access_team(f.equipe_id)
    )
  )
  WITH CHECK (
    formulario_id IN (
      SELECT f.id
      FROM public.formularios f
      WHERE public.can_access_team(f.equipe_id)
    )
  );

-- Justificativa: perguntas não têm equipe_id próprio. A equipe é derivada de
-- formularios.equipe_id, impedindo edição de formulários de outra equipe.

-- ================================================================
-- 12. EXERCICIOS
-- Regra: membros ativos/coordenador da equipe podem ver e gerenciar.
-- Permissão do Roadmap: exercicio:gerenciar concedida ao Monitor.
-- ================================================================

CREATE POLICY "exercicios: select team"
  ON public.exercicios
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "exercicios: write team"
  ON public.exercicios
  FOR ALL
  USING (public.can_access_team(equipe_id))
  WITH CHECK (public.can_access_team(equipe_id));

-- Justificativa: biblioteca de exercícios é operacional e compartilhada pela
-- equipe. O WITH CHECK impede inserir exercício em equipe alheia.
-- A autoria (created_by) deve ser preenchida pelo app/trigger, sem impedir que
-- outro membro da equipe edite conteúdo operacional compartilhado.

-- ================================================================
-- 13. CIRCUITOS
-- Regra: membros ativos/coordenador da equipe podem ver e gerenciar.
-- Permissão do Roadmap: circuito:gerenciar concedida ao Monitor.
-- ================================================================

CREATE POLICY "circuitos: select team"
  ON public.circuitos
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "circuitos: write team"
  ON public.circuitos
  FOR ALL
  USING (public.can_access_team(equipe_id))
  WITH CHECK (
    public.can_access_team(equipe_id)
    AND (
      formulario_id IS NULL
      OR formulario_id IN (
        SELECT f.id
        FROM public.formularios f
        WHERE f.equipe_id = circuitos.equipe_id
          AND public.can_access_team(f.equipe_id)
      )
    )
  );

-- Alteração: além de validar a equipe do circuito, valida que o formulario_id
-- opcional pertence à mesma equipe. Isso evita circuito de uma equipe apontar
-- para formulário de outra.


-- ================================================================
-- 14. ITENS_CIRCUITO
-- Regra: acesso herdado do circuito pai.
--
-- Alteração: valida também se o exercicio_id pertence à mesma equipe do circuito.
-- O arquivo anterior só validava o circuito, permitindo combinar circuito de
-- uma equipe com exercício de outra caso o UUID fosse conhecido.
-- ================================================================

CREATE POLICY "itens_circuito: via circuito"
  ON public.itens_circuito
  FOR ALL
  USING (
    circuito_id IN (
      SELECT c.id
      FROM public.circuitos c
      WHERE public.can_access_team(c.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.circuitos c
      JOIN public.exercicios e ON e.id = itens_circuito.exercicio_id
      WHERE c.id = itens_circuito.circuito_id
        AND c.equipe_id = e.equipe_id
        AND public.can_access_team(c.equipe_id)
    )
  );

-- Justificativa: ItemCircuito é composição do circuito. A validação cruzada
-- preserva consistência de equipe entre circuito e exercício.
-- ════════════════════════════════════════════════════════════════════
-- Migration: RLS — Avaliações MABC-2
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: Blindar as tabelas formularios e respostas_formulario
-- garantindo que avaliações MABC-2 e suas respostas só possam ser
-- lidas, editadas ou apagadas por membros ativos da equipe responsável
-- pela criança. Templates base do sistema têm leitura liberada para
-- que o front-end consiga cloná-los.
--
-- Políticas criadas:
--   ✓ mabc2_templates_leitura   — SELECT global em formularios onde
--                                  protegido = TRUE e tipo = 'mabc2'
--   ✓ mabc2_instancias_acesso   — ALL em formularios onde
--                                  protegido = FALSE e tipo = 'mabc2',
--                                  validando is_team_member via aluno_id
--   ✓ respostas_mabc2_equipe    — ALL em respostas_formulario,
--                                  navegando até o formulário pai para
--                                  descobrir o aluno e validar acesso
-- ════════════════════════════════════════════════════════════════════

CREATE POLICY mabc2_templates_leitura
  ON public.formularios
  FOR SELECT
  USING (
    protegido = TRUE
    AND tipo = 'mabc2'
  );

CREATE POLICY mabc2_instancias_acesso
  ON public.formularios
  FOR ALL
  USING (
    protegido = FALSE
    AND tipo = 'mabc2'
    AND is_team_member(
      (SELECT equipe_id FROM public.alunos WHERE id = formularios.aluno_id)
    )
  )
  WITH CHECK (
    protegido = FALSE
    AND tipo = 'mabc2'
    AND is_team_member(
      (SELECT equipe_id FROM public.alunos WHERE id = formularios.aluno_id)
    )
  );

CREATE POLICY respostas_mabc2_equipe
  ON public.respostas_formulario
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.formularios f
      JOIN public.alunos a ON a.id = f.aluno_id
      WHERE
        f.id   = respostas_formulario.formulario_id
        AND f.tipo = 'mabc2'
        AND is_team_member(a.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.formularios f
      JOIN public.alunos a ON a.id = f.aluno_id
      WHERE
        f.id   = respostas_formulario.formulario_id
        AND f.tipo = 'mabc2'
        AND is_team_member(a.equipe_id)
    )
  );
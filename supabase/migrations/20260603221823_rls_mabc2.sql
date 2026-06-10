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
--                                  validando is_team_member via equipe_id
--                                  da própria linha (sem subselect)
--   ✓ respostas_mabc2_equipe    — ALL em respostas_formulario,
--                                  navegando até o formulário pai para
--                                  validar acesso via equipe_id do
--                                  formulário (sem JOIN com alunos)
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
    AND is_team_member(equipe_id)
  )
  WITH CHECK (
    protegido = FALSE
    AND tipo = 'mabc2'
    AND is_team_member(equipe_id)
  );

CREATE POLICY respostas_mabc2_equipe
  ON public.respostas_formulario
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.formularios f
      WHERE
        f.id     = respostas_formulario.formulario_id
        AND f.tipo   = 'mabc2'
        AND is_team_member(f.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.formularios f
      WHERE
        f.id     = respostas_formulario.formulario_id
        AND f.tipo   = 'mabc2'
        AND is_team_member(f.equipe_id)
    )
  );
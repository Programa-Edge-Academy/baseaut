-- ════════════════════════════════════════════════════════════════════
-- Alinha o motivo de finalização da sessão ao enum de não realização
-- ════════════════════════════════════════════════════════════════════
-- A coluna sessoes.motivo_finalizacao usava motivo_finalizacao_enum, que diverge
-- do motivo_nao_realizacao_enum (o conjunto correto/completo, usado nas execuções
-- de exercício). Por causa disso, o front coagia motivos inexistentes para 'outro'
-- e guardava o real na descrição, perdendo a informação.
--
-- Passamos a coluna para motivo_nao_realizacao_enum, de modo que o motivo real
-- escolhido na finalização seja representado fielmente em sessoes — e possa ser
-- copiado diretamente para execucoes_exercicio.motivo_nao_realizacao (mesmo enum)
-- dos exercícios não realizados.
--
-- Mapeamento dos valores legados:
--   comportamento_disruptivo -> comportamento_disruptivo (existe em ambos)
--   tempo_esgotado           -> tempo_insuficiente
--   indisposicao_aluno       -> outro (sem equivalente)
--   problema_tecnico         -> outro (sem equivalente)
--   outro                    -> outro
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.sessoes
  ALTER COLUMN motivo_finalizacao TYPE motivo_nao_realizacao_enum
  USING (
    CASE motivo_finalizacao::text
      WHEN 'tempo_esgotado'     THEN 'tempo_insuficiente'
      WHEN 'indisposicao_aluno' THEN 'outro'
      WHEN 'problema_tecnico'   THEN 'outro'
      ELSE motivo_finalizacao::text
    END::motivo_nao_realizacao_enum
  );

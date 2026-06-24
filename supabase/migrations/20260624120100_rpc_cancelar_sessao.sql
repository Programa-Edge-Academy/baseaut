-- ════════════════════════════════════════════════════════════════════
-- rpc_cancelar_sessao: "exclusão" (soft delete) de sessão no histórico
-- ════════════════════════════════════════════════════════════════════
-- Problema: a remoção de sessão no histórico era feita com um UPDATE direto
-- (status = 'cancelada') pelo cliente. A policy de UPDATE em `sessoes` só
-- permite ao MONITOR alterar as PRÓPRIAS sessões (monitor_id = auth.uid()).
-- Logo, coordenadores e sessões criadas por outro monitor não podiam ser
-- removidas — daí "não consigo apagar algumas sessões".
--
-- Solução: cancelar via função SECURITY DEFINER que valida apenas o vínculo
-- com a equipe (mesma regra de visibilidade/auditoria de rpc_deletar_registro).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_cancelar_sessao(
  p_sessao_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipe_id UUID;
BEGIN
  SELECT equipe_id INTO v_equipe_id
  FROM public.sessoes
  WHERE id = p_sessao_id;

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Sessão não encontrada.';
  END IF;

  IF NOT public.is_team_member(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado para remover esta sessão.';
  END IF;

  UPDATE public.sessoes
  SET status = 'cancelada'
  WHERE id = p_sessao_id;

  RETURN json_build_object('ok', true, 'sessao_id', p_sessao_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cancelar_sessao(UUID) TO authenticated;

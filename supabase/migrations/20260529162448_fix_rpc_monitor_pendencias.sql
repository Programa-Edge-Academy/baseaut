CREATE OR REPLACE FUNCTION public.remover_monitor(p_monitor_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- 1. Remove o vínculo do monitor com qualquer equipe na tabela de ligação
  DELETE FROM public.membros_equipe
  WHERE usuario_id = p_monitor_id;

  -- 2. Atualiza o status da conta no perfil cadastral (sem a coluna equipe_id)
  UPDATE public.profiles
  SET 
    status_conta = 'bloqueada', -- Inativa a conta para impedir login
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'ativa';
END;
$$;


CREATE OR REPLACE FUNCTION public.verificar_pendencias_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
AS $$
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object(
             'exercicio_id', ic.exercicio_id
           )
         ), '[]'::jsonb)
  FROM public.sessoes s
  -- Tabela ponte corrigida para itens_circuito
  JOIN public.itens_circuito ic ON ic.circuito_id = s.circuito_id
  LEFT JOIN public.execucoes_exercicio ex 
         ON ex.exercicio_id = ic.exercicio_id 
        AND ex.sessao_id = p_sessao_id
  WHERE s.id = p_sessao_id
    -- Coluna de status corrigida para status_realizacao
    AND (ex.id IS NULL OR ex.status_realizacao = 'nao_realizada');
$$;
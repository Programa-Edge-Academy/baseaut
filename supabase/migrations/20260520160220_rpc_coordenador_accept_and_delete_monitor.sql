-- Função Segura para Aprovar Monitor
CREATE OR REPLACE FUNCTION public.aprovar_monitor(p_monitor_id UUID, p_equipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios de administrador (bypassa o RLS pontualmente)
AS $$
BEGIN
  -- Verifica se quem está chamando é um Coordenador
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem aprovar monitores.';
  END IF;

  -- Altera EXATAMENTE e APENAS o status e a equipe
  UPDATE public.profiles
  SET 
    status_conta = 'ativa',
    equipe_id = p_equipe_id,
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'pendente';
END;
$$;

ALTER TYPE status_conta ADD VALUE 'rejeitada';

-- Função para Rejeitar Solicitação Inicial
CREATE OR REPLACE FUNCTION public.rejeitar_monitor(p_monitor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem rejeitar monitores.';
  END IF;

  -- Muda o status para 'rejeitada' para o front-end avisar o usuário amigavelmente
  UPDATE public.profiles
  SET 
    status_conta = 'rejeitada',
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'pendente';
END;
$$;


-- Função para Remover Monitor da Equipe
CREATE OR REPLACE FUNCTION public.remover_monitor(p_monitor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem remover monitores.';
  END IF;

  -- Soft delete clássico: inativa a conta e tira da equipe (preserva histórico clínico)
  UPDATE public.profiles
  SET 
    status_conta = 'bloqueada', -- Inativa a conta para impedir login
    equipe_id = NULL,
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'ativa'; -- Garante que só remove quem já estava na equipe
END;
$$;
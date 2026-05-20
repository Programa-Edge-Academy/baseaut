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

-- Função Segura para Rejeitar/Bloquear Monitor (Soft Delete)
CREATE OR REPLACE FUNCTION public.rejeitar_monitor(p_monitor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se quem está chamando é um coordenador
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem rejeitar monitores.';
  END IF;

  -- Altera apenas o status para 'bloqueada'
  UPDATE public.profiles
  SET 
    status_conta = 'bloqueada',
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'pendente';
END;
$$;
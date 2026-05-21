-- 1. Função Segura para Aprovar Monitor (Atualiza perfil + Insere membro)
CREATE OR REPLACE FUNCTION public.aprovar_monitor(p_monitor_id UUID, p_equipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se quem está chamando é um Coordenador
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem aprovar monitores.';
  END IF;

  -- Passo 1: Ativa o perfil
  UPDATE public.profiles
  SET 
    status_conta = 'ativa',
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'pendente';

  -- Passo 2: Insere na tabela membros_equipe com status padrao ('ativo') e papel 'monitor'
  IF FOUND THEN
    INSERT INTO public.membros_equipe (usuario_id, equipe_id, papel)
    VALUES (p_monitor_id, p_equipe_id, 'monitor');
  ELSE
    RAISE EXCEPTION 'Monitor não encontrado ou já processado.';
  END IF;
END;
$$;


-- 2. Função para Rejeitar Solicitação Inicial (Apenas altera o perfil)
CREATE OR REPLACE FUNCTION public.rejeitar_monitor(p_monitor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem rejeitar monitores.';
  END IF;

  UPDATE public.profiles
  SET 
    status_conta = 'rejeitada',
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'pendente';
END;
$$;


-- 3. Função para Remover Monitor da Equipe (Inativa perfil + Inativa vínculo)
CREATE OR REPLACE FUNCTION public.remover_monitor(p_monitor_id UUID, p_equipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_coordinator() THEN
    RAISE EXCEPTION 'Acesso negado: Apenas coordenadores podem remover monitores.';
  END IF;

  -- Passo 1: Bloqueia a conta do monitor
  UPDATE public.profiles
  SET 
    status_conta = 'bloqueada', 
    updated_at = NOW()
  WHERE id = p_monitor_id 
    AND role = 'monitor' 
    AND status_conta = 'ativa';

  -- Passo 2: Soft delete na relação da equipe (altera o status em vez de dar DELETE)
  IF FOUND THEN
    UPDATE public.membros_equipe
    SET status = 'removido'
    WHERE usuario_id = p_monitor_id
      AND equipe_id = p_equipe_id;
  END IF;
END;
$$;
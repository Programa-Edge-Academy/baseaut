-- ==============================================================================
-- MIGRATION: US 10.7 - Salvar Totais Agregados do MABC-2
-- Objetivo: Criar a RPC dedicada para salvar métricas do MABC-2 no nó de metadados
-- ==============================================================================

CREATE OR REPLACE FUNCTION rpc_salvar_totais_mabc2(
    p_formulario_id UUID,
    p_totais_jsonb JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_equipe_id UUID;
    v_tipo TEXT;
    v_protegido BOOLEAN;
BEGIN
    -- 1. Recuperar dados de controle do formulário
    SELECT equipe_id, tipo, protegido 
    INTO v_equipe_id, v_tipo, v_protegido
    FROM formularios
    WHERE id = p_formulario_id;

    -- Validações iniciais de existência e tipo
    IF v_equipe_id IS NULL THEN
        RAISE EXCEPTION 'Formulário não encontrado ou não possui uma equipe associada.';
    END IF;

    IF v_tipo != 'mabc2' OR v_protegido = TRUE THEN
        RAISE EXCEPTION 'Operação inválida: Só é permitido salvar totais em instâncias ativas do MABC-2.';
    END IF;

    -- 2. Trava de Segurança usando a função do sistema (RLS)
    IF NOT is_team_member(v_equipe_id) THEN
        RAISE EXCEPTION 'Acesso negado: O usuário não é um membro autorizado para esta equipe.';
    END IF;

    -- 3. Atualização de Metadados (JSONB Merge), Avaliador e Data
    UPDATE formularios
    SET 
        metadados = COALESCE(metadados, '{}'::jsonb) || p_totais_jsonb,
        avaliador_id = auth.uid(),
        updated_at = NOW() 
    WHERE id = p_formulario_id;

END;
$$;
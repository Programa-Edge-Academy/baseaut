-- RPCs para Gerenciamento do Histórico de Registros
-- Baseado estritamente nos requisitos da task.rtf

-- 1. rpc_editar_resposta
-- [Critério A]: Função aceita p_resposta_id, p_novo_valor, p_novo_ajuda e p_novo_status
CREATE OR REPLACE FUNCTION public.rpc_editar_resposta(
    p_resposta_id UUID,
    p_novo_valor TEXT DEFAULT NULL,
    p_novo_ajuda JSONB DEFAULT NULL,
    p_novo_status status_item_resposta DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_aluno_id UUID;
    v_autorizado BOOLEAN;
BEGIN
    -- Identificar o aluno dono da resposta
    SELECT COALESCE(f.aluno_id, s.aluno_id) INTO v_aluno_id
    FROM public.respostas_formulario rf
    LEFT JOIN public.formularios f ON rf.formulario_id = f.id
    LEFT JOIN public.sessoes s ON rf.sessao_id = s.id
    WHERE rf.id = p_resposta_id;

    IF v_aluno_id IS NULL THEN
        RAISE EXCEPTION 'Resposta não encontrada no histórico.';
    END IF;

    -- [Critério B (Segurança)]: Valida se o usuário pertence à equipe do aluno
    SELECT EXISTS (
        SELECT 1 
        FROM public.alunos a
        JOIN public.membros_equipe me ON a.equipe_id = me.equipe_id
        WHERE a.id = v_aluno_id 
          AND me.usuario_id = auth.uid()
          AND me.status = 'ativo'
    ) INTO v_autorizado;

    IF NOT v_autorizado THEN
        RAISE EXCEPTION 'Acesso negado: Você não tem permissão para editar dados deste aluno.';
    END IF;

    -- [Critério C (Integridade)]: Usa COALESCE para preservar dados originais
    UPDATE public.respostas_formulario
    SET 
        valor_preenchido = COALESCE(p_novo_valor, valor_preenchido),
        valor_ajuda = COALESCE(p_novo_ajuda, valor_ajuda),
        status_item = COALESCE(p_novo_status, status_item),
        -- [Critério C (Auditoria)]: Atualiza a coluna atualizado_em
        atualizado_em = NOW()
    WHERE id = p_resposta_id;

    -- [Payload]: Retorna {"ok": true, "atualizado_em": "..."}
    RETURN json_build_object(
        'ok', true,
        'atualizado_em', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. rpc_deletar_registro
-- [Critério D]: Função aceita p_tipo ('sessao' ou 'formulario') e p_id
CREATE OR REPLACE FUNCTION public.rpc_deletar_registro(
    p_tipo TEXT,
    p_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_aluno_id UUID;
    v_equipe_id UUID;
    v_autorizado BOOLEAN;
    v_protegido BOOLEAN;
BEGIN
    -- Validação por tipo: Sessão
    IF p_tipo = 'sessao' THEN
        SELECT aluno_id, equipe_id INTO v_aluno_id, v_equipe_id
        FROM public.sessoes
        WHERE id = p_id;

        IF v_aluno_id IS NULL THEN
            RAISE EXCEPTION 'Sessão não encontrada.';
        END IF;

        -- [Critério E (Sessão)]: Valida autorização da equipe
        SELECT EXISTS (
            SELECT 1 FROM public.membros_equipe 
            WHERE equipe_id = v_equipe_id 
              AND usuario_id = auth.uid() 
              AND status = 'ativo'
        ) INTO v_autorizado;

        IF NOT v_autorizado THEN
            RAISE EXCEPTION 'Acesso negado para deletar esta sessão.';
        END IF;

        -- [Critério E (Cascata)]: Deleta filhas (respostas) antes da pai (sessão)
        DELETE FROM public.respostas_formulario WHERE sessao_id = p_id;
        DELETE FROM public.sessoes WHERE id = p_id;

    -- Validação por tipo: Formulário
    ELSIF p_tipo = 'formulario' THEN
        -- [Critério F (Proteção)]: Bloqueia deleção se formulário for protegido
        SELECT equipe_id, (metadados->>'protegido')::boolean INTO v_equipe_id, v_protegido
        FROM public.formularios
        WHERE id = p_id;

        IF v_protegido = TRUE THEN
            RAISE EXCEPTION 'Este formulário está protegido e não pode ser excluído.';
        END IF;

        IF v_equipe_id IS NULL THEN
            RAISE EXCEPTION 'Formulário não encontrado.';
        END IF;

        -- [Critério G (Formulário)]: Valida autorização da equipe
        SELECT EXISTS (
            SELECT 1 FROM public.membros_equipe 
            WHERE equipe_id = v_equipe_id 
              AND usuario_id = auth.uid() 
              AND status = 'ativo'
        ) INTO v_autorizado;

        IF NOT v_autorizado THEN
            RAISE EXCEPTION 'Acesso negado para deletar este formulário.';
        END IF;

        -- [Critério G (Cascata)]: Deleta filhas (respostas) antes da pai (formulário)
        DELETE FROM public.respostas_formulario WHERE formulario_id = p_id;
        DELETE FROM public.formularios WHERE id = p_id;

    ELSE
        RAISE EXCEPTION 'Tipo de registro inválido. Use "sessao" ou "formulario".';
    END IF;

    -- [Payload]: Retorna {"ok": true, "deleted_type": "...", "deleted_id": "..."}
    RETURN json_build_object(
        'ok', true,
        'deleted_type', p_tipo,
        'deleted_id', p_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

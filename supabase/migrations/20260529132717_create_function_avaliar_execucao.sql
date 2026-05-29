CREATE OR REPLACE FUNCTION public.avaliar_execucao_exercicio(
    p_execucao_id             uuid,
    p_status_realizacao        status_realizacao_enum,
    p_nivel_desenvolvimento    nivel_desenvolvimento_enum DEFAULT NULL,
    p_registro_ajuda           registro_ajuda_enum        DEFAULT NULL,
    p_complementos_ajuda       text[]                     DEFAULT NULL,
    p_motivo_nao_realizacao    motivo_nao_realizacao_enum DEFAULT NULL,
    p_descricao_adicional      text                       DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_affected integer;
BEGIN

    -- ----------------------------------------------------------------
    -- PASSO 1: se realizada, nivel_desenvolvimento e registro_ajuda
    --          são obrigatórios
    -- ----------------------------------------------------------------
    IF p_status_realizacao = 'realizada' THEN

        IF p_nivel_desenvolvimento IS NULL THEN
            RETURN jsonb_build_object(
                'ok',    false,
                'erro',  'O Nível de Desenvolvimento é obrigatório quando a atividade for marcada como Realizada.'
            );
        END IF;

        IF p_registro_ajuda IS NULL THEN
            RETURN jsonb_build_object(
                'ok',    false,
                'erro',  'O Tipo de Ajuda é obrigatório quando a atividade for marcada como Realizada.'
            );
        END IF;

        -- ------------------------------------------------------------
        -- PASSO 2: se autônomo, complementos_ajuda é obrigatório 
        --          (Não pode ser NULL e nem ter tamanho zero)
        -- ------------------------------------------------------------
        IF p_registro_ajuda = 'autonomo' THEN
            IF p_complementos_ajuda IS NULL 
               OR coalesce(array_length(p_complementos_ajuda, 1), 0) = 0 THEN
                RETURN jsonb_build_object(
                    'ok',    false,
                    'erro',  'Ao selecionar Ajuda Autônoma é necessário informar pelo menos um complemento.'
                );
            END IF;
        END IF;

    END IF;

    -- ----------------------------------------------------------------
    -- PASSO 3: se nao_realizada, motivo é obrigatório
    -- ----------------------------------------------------------------
    IF p_status_realizacao = 'nao_realizada' THEN

        IF p_motivo_nao_realizacao IS NULL THEN
            RETURN jsonb_build_object(
                'ok',    false,
                'erro',  'O Motivo da Não Realização é obrigatório quando a atividade for marcada como Não Realizada.'
            );
        END IF;

        -- ------------------------------------------------------------
        -- PASSO 4: se motivo = outro, descricao_adicional é obrigatória
        -- ------------------------------------------------------------
        IF p_motivo_nao_realizacao = 'outro' THEN
            IF p_descricao_adicional IS NULL
               OR trim(p_descricao_adicional) = '' THEN
                RETURN jsonb_build_object(
                    'ok',    false,
                    'erro',  'A Descrição Adicional é obrigatória quando o motivo for "Outro".'
                );
            END IF;
        END IF;

    END IF;

    -- ----------------------------------------------------------------
    -- PASSO 5: UPDATE direto
    -- ----------------------------------------------------------------
    UPDATE public.execucoes_exercicio
    SET
        status_realizacao     = p_status_realizacao,
        nivel_desenvolvimento = p_nivel_desenvolvimento,
        registro_ajuda        = p_registro_ajuda,
        complementos_ajuda    = p_complementos_ajuda,
        motivo_nao_realizacao = p_motivo_nao_realizacao,
        descricao_adicional   = p_descricao_adicional
    WHERE id = p_execucao_id;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        RETURN jsonb_build_object(
            'ok',    false,
            'erro',  'Execução não encontrada. Nenhum registro foi atualizado.'
        );
    END IF;

    RETURN jsonb_build_object('ok', true);

END;
$$;
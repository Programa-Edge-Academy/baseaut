-- =======================================================================
-- Migration: múltiplos motivos de não realização / finalização
-- =======================================================================
-- Tanto o resultado de um exercício não realizado quanto a finalização
-- precoce de uma sessão passam a aceitar MAIS DE UM motivo. As colunas
-- deixam de guardar um único valor do enum e passam a guardar um array.
--
-- Os valores 'tempo_insuficiente' e 'dificuldade_fisica' saem da interface,
-- mas continuam existindo no ENUM de propósito: registros antigos já os
-- referenciam e removê-los do tipo obrigaria a reescrever esse histórico.

-- ----------------------------------------------------------------------
-- 1. Execuções de exercício
-- ----------------------------------------------------------------------
ALTER TABLE public.execucoes_exercicio
  ALTER COLUMN motivo_nao_realizacao TYPE motivo_nao_realizacao_enum[]
  USING (
    CASE
      WHEN motivo_nao_realizacao IS NULL THEN NULL
      ELSE ARRAY[motivo_nao_realizacao]
    END
  );

-- ----------------------------------------------------------------------
-- 2. Sessões (motivo da finalização precoce)
-- ----------------------------------------------------------------------
ALTER TABLE public.sessoes
  ALTER COLUMN motivo_finalizacao TYPE motivo_nao_realizacao_enum[]
  USING (
    CASE
      WHEN motivo_finalizacao IS NULL THEN NULL
      ELSE ARRAY[motivo_finalizacao]
    END
  );

COMMENT ON COLUMN public.execucoes_exercicio.motivo_nao_realizacao IS
  'Um ou mais motivos da não realização. NULL quando a atividade foi realizada.';

COMMENT ON COLUMN public.sessoes.motivo_finalizacao IS
  'Um ou mais motivos da finalização precoce da sessão.';

-- ----------------------------------------------------------------------
-- 3. Realinha a RPC de avaliação ao novo tipo
-- ----------------------------------------------------------------------
-- A assinatura muda (o motivo virou array), então a versão antiga precisa
-- ser removida antes de recriar. Além do array, o passo de não realização
-- deixa de apagar nível/ajuda: agora esses dados também são registrados
-- quando a atividade não é realizada.
DROP FUNCTION IF EXISTS public.avaliar_execucao_exercicio(
  uuid,
  status_realizacao_enum,
  nivel_desenvolvimento_enum,
  registro_ajuda_enum,
  text[],
  motivo_nao_realizacao_enum,
  text
);

CREATE OR REPLACE FUNCTION public.avaliar_execucao_exercicio(
    p_execucao_id             uuid,
    p_status_realizacao        status_realizacao_enum,
    p_nivel_desenvolvimento    nivel_desenvolvimento_enum   DEFAULT NULL,
    p_registro_ajuda           registro_ajuda_enum          DEFAULT NULL,
    p_complementos_ajuda       text[]                       DEFAULT NULL,
    p_motivo_nao_realizacao    motivo_nao_realizacao_enum[] DEFAULT NULL,
    p_descricao_adicional      text                         DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_affected integer;
BEGIN

    -- PASSO 1: se realizada, nivel_desenvolvimento e registro_ajuda
    --          são obrigatórios
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

        -- PASSO 2: se autônomo, complementos_ajuda é obrigatório
        --          (Não pode ser NULL e nem ter tamanho zero)
        IF p_registro_ajuda = 'autonomo' THEN
            IF p_complementos_ajuda IS NULL
               OR coalesce(array_length(p_complementos_ajuda, 1), 0) = 0 THEN
                RETURN jsonb_build_object(
                    'ok',    false,
                    'erro',  'Ao selecionar Ajuda Autônoma é necessário informar pelo menos um complemento.'
                );
            END IF;
        ELSE
            p_complementos_ajuda := NULL;
        END IF;

        p_motivo_nao_realizacao := NULL;
        p_descricao_adicional   := NULL;

    END IF;

    -- PASSO 3: se nao_realizada, ao menos um motivo é obrigatório
    IF p_status_realizacao = 'nao_realizada' THEN

        IF p_motivo_nao_realizacao IS NULL
           OR coalesce(array_length(p_motivo_nao_realizacao, 1), 0) = 0 THEN
            RETURN jsonb_build_object(
                'ok',    false,
                'erro',  'O Motivo da Não Realização é obrigatório quando a atividade for marcada como Não Realizada.'
            );
        END IF;

        -- PASSO 4: se algum motivo for "outro", descricao_adicional é
        --          obrigatória
        IF 'outro' = ANY (p_motivo_nao_realizacao) THEN
            IF p_descricao_adicional IS NULL
               OR trim(p_descricao_adicional) = '' THEN
                RETURN jsonb_build_object(
                    'ok',    false,
                    'erro',  'A Descrição Adicional é obrigatória quando o motivo for "Outro".'
                );
            END IF;
        ELSE
            p_descricao_adicional := NULL;
        END IF;

        -- Nível e ajuda continuam válidos aqui: mesmo sem concluir, o que
        -- foi observado durante a tentativa é registrado.

    END IF;

    -- PASSO 5: UPDATE direto
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

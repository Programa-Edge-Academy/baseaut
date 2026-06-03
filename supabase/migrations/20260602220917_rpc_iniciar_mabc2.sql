CREATE OR REPLACE FUNCTION rpc_iniciar_mabc2(
    p_aluno_id    UUID,
    p_avaliador_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_data_nascimento DATE;
    v_idade           INT;
    v_faixa           INT;
    v_template_id     UUID;
    v_formulario_id   UUID;
    v_itens           JSONB;
BEGIN
    -- 1. Buscar data de nascimento do aluno
    SELECT data_nascimento
    INTO v_data_nascimento
    FROM alunos
    WHERE id = p_aluno_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno não encontrado: %', p_aluno_id;
    END IF;

    -- 2. Calcular idade
    v_idade := DATE_PART('year', AGE(v_data_nascimento));

    -- 3. Determinar faixa
    v_faixa := CASE
        WHEN v_idade BETWEEN 3  AND 6  THEN 1
        WHEN v_idade BETWEEN 7  AND 10 THEN 2
        WHEN v_idade BETWEEN 11 AND 16 THEN 3
        ELSE NULL
    END;

    IF v_faixa IS NULL THEN
        RAISE EXCEPTION 'Idade % fora do intervalo suportado pelo MABC-2 (3–16 anos)', v_idade;
    END IF;

    -- 4. Buscar template da faixa
    SELECT id
    INTO v_template_id
    FROM formularios
    WHERE tipo = 'mabc2'
      AND protegido = TRUE
      AND metadados->>'faixa_mabc' = v_faixa::TEXT;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template MABC-2 não encontrado para faixa %', v_faixa;
    END IF;

    -- 5. Inserir nova instância
    INSERT INTO formularios (
        titulo,
        tipo,
        equipe_id,
        ativo,
        aluno_id,
        avaliador_id,
        protegido,
        template_origem_id,
        metadados
    )
    SELECT
        f.titulo,
        f.tipo,
        f.equipe_id,
        TRUE,
        p_aluno_id,
        p_avaliador_id,
        FALSE,
        v_template_id,
        f.metadados
    FROM formularios f
    WHERE f.id = v_template_id
    RETURNING id INTO v_formulario_id;

    -- 6. Montar array de itens do template
    SELECT jsonb_agg(
        jsonb_build_object(
            'id',             p.id,
            'texto_pergunta', p.texto_pergunta,
            'tipo_resposta',  p.tipo_resposta,
            'opcoes',         p.opcoes,
            'obrigatoria',    p.obrigatoria,
            'ordem',          p.ordem
        )
        ORDER BY p.ordem
    )
    INTO v_itens
    FROM perguntas p
    WHERE p.formulario_id = v_template_id;

    -- 7. Retornar resultado
    RETURN jsonb_build_object(
        'formulario_id', v_formulario_id,
        'itens',         v_itens
    );
END;
$$;
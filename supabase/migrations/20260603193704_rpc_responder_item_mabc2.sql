CREATE OR REPLACE FUNCTION public.rpc_responder_item_mabc2(
  p_formulario_id  UUID,
  p_pergunta_id    UUID,
  p_escore_bruto   INTEGER DEFAULT NULL,
  p_nivel_ajuda    TEXT DEFAULT NULL,
  p_complementos   TEXT[] DEFAULT NULL,
  p_status         TEXT DEFAULT 'respondido'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Armazena o aluno vinculado ao formulário
  v_aluno_id UUID;

  -- Armazena o JSON de ajuda com segurança
  -- Fica NULL para itens adiados/não realizados
  v_valor_ajuda JSONB := NULL;
BEGIN
  ------------------------------------------------------------------
  -- 1) Buscar o aluno_id do formulário
  ------------------------------------------------------------------
  SELECT aluno_id
    INTO v_aluno_id
  FROM public.formularios
  WHERE id = p_formulario_id;

  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Formulário sem aluno vinculado.';
  END IF;

  ------------------------------------------------------------------
  -- 2) Validar apenas quando o item foi respondido
  ------------------------------------------------------------------
  IF p_status = 'respondido' THEN

    -- Escore bruto é obrigatório e não pode ser negativo
    IF p_escore_bruto IS NULL OR p_escore_bruto < 0 THEN
      RAISE EXCEPTION 'Escore bruto inválido: não pode ser nulo ou negativo quando status é respondido.';
    END IF;

    -- Nível de ajuda só é obrigatório para item respondido
    IF p_nivel_ajuda IS NULL OR p_nivel_ajuda NOT IN ('autonomo', 'ajuda_intrusiva') THEN
      RAISE EXCEPTION 'Nível de ajuda inválido: deve ser "autonomo" ou "ajuda_intrusiva".';
    END IF;

    -- Se o nível for autônomo, precisa ter ao menos um complemento
    IF p_nivel_ajuda = 'autonomo' THEN
      IF p_complementos IS NULL OR cardinality(p_complementos) = 0 THEN
        RAISE EXCEPTION 'Complementos obrigatórios: nível "autonomo" exige ao menos um complemento.';
      END IF;
    END IF;

    -- Monta o JSON de ajuda apenas para itens respondidos
    v_valor_ajuda := jsonb_build_object(
      'nivel', p_nivel_ajuda,
      'complementos', p_complementos
    );
  END IF;

  ------------------------------------------------------------------
  -- 3) Inserir ou atualizar a resposta
  ------------------------------------------------------------------
  INSERT INTO public.respostas_formulario (
    formulario_id,
    pergunta_id,
    valor_preenchido,
    valor_ajuda,
    status_item,
    atualizado_em,
    aluno_id
  )
  VALUES (
    p_formulario_id,
    p_pergunta_id,
    p_escore_bruto::TEXT,
    v_valor_ajuda,
    p_status::status_item_resposta,
    now(),
    v_aluno_id
  )
  ON CONFLICT (formulario_id, pergunta_id)
  DO UPDATE SET
    valor_preenchido = EXCLUDED.valor_preenchido,
    valor_ajuda = EXCLUDED.valor_ajuda,
    status_item = EXCLUDED.status_item,
    atualizado_em = now(),
    aluno_id = EXCLUDED.aluno_id;

  ------------------------------------------------------------------
  -- 4) Retornar confirmação
  ------------------------------------------------------------------
  RETURN json_build_object(
    'ok', true,
    'formulario_id', p_formulario_id,
    'pergunta_id', p_pergunta_id,
    'status', p_status
  );
END;
$$;
-- ════════════════════════════════════════════════════════════════════
-- Preenche formularios.avaliador_id ao ATA / CARS
-- ════════════════════════════════════════════════════════════════════
-- Sempre que o usuário inicia um formulário para um aluno, seu id deve ir
-- para formularios.avaliador_id:
--   • ATA/CARS → criados sob demanda por criar_nova_avaliacao; usa auth.uid().
-- (MABC-2 já preenchia via rpc_iniciar_mabc2.)
-- ════════════════════════════════════════════════════════════════════

-- ── ATA / CARS: criação sob demanda ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.criar_nova_avaliacao(
  p_aluno_id UUID,
  p_tipo TEXT,
  p_data DATE DEFAULT CURRENT_DATE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_nova_inst_id UUID := gen_random_uuid();
  v_equipe_id UUID;
  v_nome_aluno TEXT;
BEGIN
  SELECT equipe_id, nome_completo INTO v_equipe_id, v_nome_aluno
  FROM public.alunos WHERE id = p_aluno_id;

  IF v_equipe_id IS NULL THEN
      RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  SELECT id INTO v_template_id
  FROM public.formularios
  WHERE tipo = p_tipo::tipo_formulario
    AND protegido = TRUE
    AND ativo = TRUE
  LIMIT 1;

  IF v_template_id IS NULL THEN
      RAISE EXCEPTION 'Template global para % não encontrado.', p_tipo;
  END IF;

  IF p_tipo = 'mabc2' THEN
      RAISE EXCEPTION 'Operação negada: Para MABC-2, utilize a função específica rpc_iniciar_mabc2.';
  END IF;

  INSERT INTO public.formularios (
    id,
    titulo,
    descricao,
    tipo,
    equipe_id,
    aluno_id,
    avaliador_id,
    protegido,
    ativo,
    data_avaliacao,
    template_origem_id
  )
  SELECT
    v_nova_inst_id,
    UPPER(p_tipo) || ' - ' || v_nome_aluno || ' - ' || TO_CHAR(p_data, 'DD/MM/YYYY'),
    descricao,
    tipo,
    v_equipe_id,
    p_aluno_id,
    auth.uid(),
    false,
    true,
    p_data,
    v_template_id
  FROM public.formularios WHERE id = v_template_id;

  RETURN v_nova_inst_id;
END;
$$;

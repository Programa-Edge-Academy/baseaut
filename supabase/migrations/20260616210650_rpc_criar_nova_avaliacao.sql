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
  -- 1. Buscar dados do aluno para a concatenação
  SELECT equipe_id, nome_completo INTO v_equipe_id, v_nome_aluno
  FROM public.alunos WHERE id = p_aluno_id;

  IF v_equipe_id IS NULL THEN
      RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;
  

  -- 2. Buscar o template original (Global) com segurança
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

  -- 3. Criar a Instância apontando para o Template (Sem clonar perguntas)
  INSERT INTO public.formularios (
    id, 
    titulo, 
    descricao, 
    tipo, 
    equipe_id, 
    aluno_id, 
    protegido,          -- CORREÇÃO 1: A flag de segurança
    ativo, 
    data_avaliacao,
    template_origem_id  -- CORREÇÃO 2: O vínculo com as perguntas
  )
  SELECT
    v_nova_inst_id,
    UPPER(p_tipo) || ' - ' || v_nome_aluno || ' - ' || TO_CHAR(p_data, 'DD/MM/YYYY'),
    descricao, 
    tipo, 
    v_equipe_id, 
    p_aluno_id, 
    false,              -- Instância SEMPRE é false!
    true, 
    p_data,
    v_template_id       -- Salva de qual template as perguntas virão
  FROM public.formularios WHERE id = v_template_id;

  -- O "Passo 3" (cópia de perguntas) foi completamente deletado!

  RETURN v_nova_inst_id;
END;
$$;
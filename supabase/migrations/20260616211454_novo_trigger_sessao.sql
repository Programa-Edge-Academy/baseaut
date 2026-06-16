CREATE OR REPLACE FUNCTION public.handle_sessao_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template     RECORD;
  v_nova_inst_id UUID := gen_random_uuid();
  v_aluno_nome   TEXT;
BEGIN
  -- Se já vier preenchido, respeita (Saída rápida)
  IF NEW.formulario_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se não tem circuito, não tem registro de controle a herdar
  IF NEW.circuito_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca o Template Global do Registro de Controle (RC) salvo no circuito
  SELECT f.* INTO v_template
  FROM public.circuitos c
  JOIN public.formularios f ON f.id = c.formulario_id
  WHERE c.id = NEW.circuito_id;

  -- Se o circuito não tiver formulário associado, aborta
  IF v_template.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca o nome do aluno para montar o título do formulário
  SELECT nome_completo INTO v_aluno_nome
  FROM public.alunos
  WHERE id = NEW.aluno_id;

  -- CORREÇÃO VITAL: Cria uma INSTÂNCIA do RC exclusiva para esta sessão!
  INSERT INTO public.formularios (
    id, titulo, descricao, tipo, equipe_id, aluno_id, 
    protegido, ativo, template_origem_id, data_avaliacao
  )
  VALUES (
    v_nova_inst_id,
    'RC - ' || v_aluno_nome || ' - Sessão ' || TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY'),
    v_template.descricao,
    v_template.tipo,
    NEW.equipe_id,
    NEW.aluno_id,
    false,               -- Instância nasce como false
    true,
    v_template.id,       -- Aponta para o RC Global
    CURRENT_DATE
  );

  -- Define o ID da nova Instância na Sessão antes do banco gravar
  NEW.formulario_id := v_nova_inst_id;

  RETURN NEW;
END;
$$;
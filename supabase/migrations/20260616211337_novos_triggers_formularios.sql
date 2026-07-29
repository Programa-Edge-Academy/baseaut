CREATE OR REPLACE FUNCTION public.handle_aluno_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template  RECORD;
BEGIN
  -- Itera sobre os templates globais de ATA e CARS com a trava correta
  FOR v_template IN
    SELECT id, tipo, descricao, ativo
    FROM public.formularios
    WHERE tipo IN ('ata', 'cars')
      AND protegido = TRUE
  LOOP
    -- Cria apenas a INSTÂNCIA, sem copiar as perguntas (conforme Decisão #2)
    INSERT INTO public.formularios (
      titulo,
      descricao,
      tipo,
      equipe_id,
      aluno_id,
      protegido,          -- CORREÇÃO: Tem que ser false!
      ativo,
      template_origem_id, -- CORREÇÃO: Aponta para o template pai
      data_avaliacao
    )
    VALUES (
      UPPER(v_template.tipo) || ' - ' || NEW.nome_completo || ' - ' || TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY'),
      v_template.descricao,
      v_template.tipo,
      NEW.equipe_id,
      NEW.id,
      false,              -- A Instância nasce desbloqueada para o aluno
      v_template.ativo,
      v_template.id,      -- Amarração com o Global
      CURRENT_DATE
    );
  END LOOP;

  RETURN NEW;
END;
$$;
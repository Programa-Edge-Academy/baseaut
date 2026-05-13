-- Função que intercepta DELETE e converte em soft delete
CREATE OR REPLACE FUNCTION public.soft_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('UPDATE public.%I SET ativo = false WHERE id = $1', TG_TABLE_NAME)
  USING OLD.id;
  RETURN NULL;
END;
$$;

-- Trigger na tabela alunos
CREATE TRIGGER trg_soft_delete_alunos
BEFORE DELETE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.soft_delete();

-- Trigger na tabela exercicios
CREATE TRIGGER trg_soft_delete_exercicios
BEFORE DELETE ON public.exercicios
FOR EACH ROW EXECUTE FUNCTION public.soft_delete();

-- Trigger na tabela circuitos
CREATE TRIGGER trg_soft_delete_circuitos
BEFORE DELETE ON public.circuitos
FOR EACH ROW EXECUTE FUNCTION public.soft_delete();
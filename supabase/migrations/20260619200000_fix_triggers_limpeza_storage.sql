-- ════════════════════════════════════════════════════════════════════
-- CORREÇÃO DOS TRIGGERS DE LIMPEZA DE STORAGE
-- ════════════════════════════════════════════════════════════════════
-- Problema 1: Os triggers de exercícios monitoravam "midia_url",
--   mas o app salva as imagens em "icone_url".
-- Problema 2: Os triggers AFTER DELETE nunca disparam porque o app
--   usa soft-delete (UPDATE ... SET ativo = false).
-- Solução: substituir os triggers DELETE por triggers UPDATE que
--   detectam soft-delete (ativo mudou para false) e usar a coluna
--   correta (icone_url) para exercícios.
-- ════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────
-- FUNÇÃO — Trigger para soft-delete: limpa imagem quando ativo → false
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_storage_cleanup_on_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket TEXT := TG_ARGV[0];
  v_coluna TEXT := TG_ARGV[1];
  v_url    TEXT;
BEGIN
  EXECUTE format('SELECT ($1).%I', v_coluna) INTO v_url USING OLD;

  IF v_url IS NOT NULL THEN
    PERFORM public.delete_storage_object(v_bucket, v_url);
  END IF;

  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════════════
-- ALUNOS — Substituir trigger DELETE por trigger de soft-delete
-- ════════════════════════════════════════════════════════════════════

-- Remove o trigger DELETE (nunca dispara com soft-delete)
DROP TRIGGER IF EXISTS on_aluno_deleted_storage_cleanup ON public.alunos;

-- Adiciona trigger de soft-delete (ativo muda para false)
DROP TRIGGER IF EXISTS on_aluno_soft_deleted_storage_cleanup ON public.alunos;
CREATE TRIGGER on_aluno_soft_deleted_storage_cleanup
  AFTER UPDATE ON public.alunos
  FOR EACH ROW
  WHEN (OLD.ativo = TRUE AND NEW.ativo = FALSE AND OLD.avatar_url IS NOT NULL)
  EXECUTE FUNCTION public.handle_storage_cleanup_on_soft_delete('avatares', 'avatar_url');


-- ════════════════════════════════════════════════════════════════════
-- EXERCÍCIOS — Corrigir coluna e substituir trigger DELETE
-- ════════════════════════════════════════════════════════════════════

-- Remove triggers antigos (coluna errada e DELETE que nunca dispara)
DROP TRIGGER IF EXISTS on_exercicio_deleted_storage_cleanup ON public.exercicios;
DROP TRIGGER IF EXISTS on_exercicio_foto_updated_storage_cleanup ON public.exercicios;

-- Trigger de soft-delete: limpa icone_url quando ativo → false
DROP TRIGGER IF EXISTS on_exercicio_soft_deleted_storage_cleanup ON public.exercicios;
CREATE TRIGGER on_exercicio_soft_deleted_storage_cleanup
  AFTER UPDATE ON public.exercicios
  FOR EACH ROW
  WHEN (OLD.ativo = TRUE AND NEW.ativo = FALSE AND OLD.icone_url IS NOT NULL)
  EXECUTE FUNCTION public.handle_storage_cleanup_on_soft_delete('exercicio-media', 'icone_url');

-- Trigger de substituição de foto: limpa icone_url ANTIGA quando muda
DROP TRIGGER IF EXISTS on_exercicio_icone_updated_storage_cleanup ON public.exercicios;
CREATE TRIGGER on_exercicio_icone_updated_storage_cleanup
  AFTER UPDATE ON public.exercicios
  FOR EACH ROW
  WHEN (OLD.icone_url IS DISTINCT FROM NEW.icone_url AND OLD.icone_url IS NOT NULL)
  EXECUTE FUNCTION public.handle_storage_cleanup_on_update('exercicio-media', 'icone_url');

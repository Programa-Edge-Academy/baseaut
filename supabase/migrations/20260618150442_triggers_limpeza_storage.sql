-- ════════════════════════════════════════════════════════════════════
-- LIMPEZA AUTOMÁTICA DE IMAGENS NO STORAGE
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: remover automaticamente, do Storage do Supabase, as imagens
-- associadas a alunos e exercícios quando:
--   1. um aluno é excluído            -> remove alunos.avatar_url
--   2. um exercício é excluído        -> remove exercicios.midia_url
--   3. a foto de um aluno é alterada  -> remove a avatar_url ANTIGA
--   4. a foto de um exercício é alterada -> remove a midia_url ANTIGA
--
-- Por que não usar "DELETE FROM storage.objects" direto?
--   A documentação oficial do Supabase é explícita: apagar a linha de
--   storage.objects via SQL remove só o METADADO. O arquivo físico no
--   bucket (S3) fica órfão, continua ocupando espaço e nunca é cobrado/
--   liberado. A única forma correta de apagar o arquivo de fato é via
--   Storage API (DELETE /storage/v1/object/{bucket}/{path}).
--   Fonte: https://supabase.com/docs/guides/storage/management/delete-objects
--
-- Como a chamada à Storage API é feita sem um Edge Function?
--   Usamos a extensão pg_net, que faz requisições HTTP assíncronas
--   (não bloqueia a transação) direto do Postgres. As credenciais
--   (URL do projeto e service_role key) ficam no Supabase Vault, nunca
--   em texto puro na migration.
--
-- ════════════════════════════════════════════════════════════════════

-- pg_net: requisições HTTP assíncronas a partir de triggers
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ────────────────────────────────────────────────────────────────────
-- FUNÇÃO 1 — Extrair o path relativo de uma URL salva no banco
-- ────────────────────────────────────────────────────────────────────
-- Aceita tanto a URL pública completa do Supabase Storage
-- (".../storage/v1/object/public/<bucket>/<path>"), quanto uma URL
-- assinada (".../object/sign/<bucket>/<path>?token=...") quanto,
-- como fallback, o path relativo puro (caso já seja salvo assim).
CREATE OR REPLACE FUNCTION public.storage_object_path(p_url TEXT, p_bucket TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_marker TEXT;
  v_idx    INT;
BEGIN
  IF p_url IS NULL OR length(trim(p_url)) = 0 THEN
    RETURN NULL;
  END IF;

  -- URL pública: .../object/public/<bucket>/<path>
  v_marker := '/object/public/' || p_bucket || '/';
  v_idx := position(v_marker IN p_url);
  IF v_idx > 0 THEN
    RETURN substring(p_url FROM v_idx + length(v_marker));
  END IF;

  -- URL assinada: .../object/sign/<bucket>/<path>?token=...
  v_marker := '/object/sign/' || p_bucket || '/';
  v_idx := position(v_marker IN p_url);
  IF v_idx > 0 THEN
    RETURN split_part(substring(p_url FROM v_idx + length(v_marker)), '?', 1);
  END IF;

  -- Fallback: já é um path relativo (sem protocolo http/https)
  IF position('http://' IN p_url) = 0 AND position('https://' IN p_url) = 0 THEN
    RETURN p_url;
  END IF;

  -- URL em formato não reconhecido para este bucket: não há o que apagar
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.storage_object_path(TEXT, TEXT) FROM PUBLIC;


-- ────────────────────────────────────────────────────────────────────
-- FUNÇÃO 2 — Apagar um objeto do Storage via Storage API (pg_net)
-- ────────────────────────────────────────────────────────────────────
-- Função utilitária central, reaproveitada por todos os triggers de
-- limpeza. SECURITY DEFINER para poder ler vault.decrypted_secrets,
-- cujo acesso é restrito por padrão.
CREATE OR REPLACE FUNCTION public.delete_storage_object(p_bucket TEXT, p_url TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path             TEXT;
  v_project_url       TEXT;
  v_service_role_key  TEXT;
BEGIN
  v_path := public.storage_object_path(p_url, p_bucket);
  IF v_path IS NULL THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets WHERE name = 'project_url';

  SELECT decrypted_secret INTO v_service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  -- Degrada com segurança: sem segredo configurado, apenas avisa nos
  -- logs e segue — nunca derruba a transação do aluno/exercício.
  IF v_project_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE WARNING
      'delete_storage_object: segredos "project_url"/"service_role_key" não configurados no Vault. Objeto % / % não foi removido do bucket.',
      p_bucket, v_path;
    RETURN;
  END IF;

  -- Chamada assíncrona (não bloqueia o commit da transação atual)
  PERFORM net.http_delete(
    url     := v_project_url || '/storage/v1/object/' || p_bucket || '/' || v_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'apikey',        v_service_role_key
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_storage_object(TEXT, TEXT) FROM PUBLIC;


-- ────────────────────────────────────────────────────────────────────
-- FUNÇÃO 3 — Trigger genérico: exclusão de linha (AFTER DELETE)
-- ────────────────────────────────────────────────────────────────────
-- Reaproveitável por qualquer tabela com uma coluna de URL de imagem.
-- Argumentos do trigger (TG_ARGV): [0] = bucket, [1] = nome da coluna.
CREATE OR REPLACE FUNCTION public.handle_storage_cleanup_on_delete()
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

  RETURN OLD;
END;
$$;


-- ────────────────────────────────────────────────────────────────────
-- FUNÇÃO 4 — Trigger genérico: foto substituída (AFTER UPDATE)
-- ────────────────────────────────────────────────────────────────────
-- O filtro "a coluna realmente mudou" já é feito na cláusula WHEN do
-- CREATE TRIGGER (mais eficiente: o Postgres nem chega a invocar esta
-- função quando a URL não muda). Aqui só removemos a imagem ANTIGA.
CREATE OR REPLACE FUNCTION public.handle_storage_cleanup_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket  TEXT := TG_ARGV[0];
  v_coluna  TEXT := TG_ARGV[1];
  v_url_old TEXT;
BEGIN
  EXECUTE format('SELECT ($1).%I', v_coluna) INTO v_url_old USING OLD;

  IF v_url_old IS NOT NULL THEN
    PERFORM public.delete_storage_object(v_bucket, v_url_old);
  END IF;

  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════════════
-- TRIGGERS — ALUNOS
-- ════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_aluno_deleted_storage_cleanup ON public.alunos;
CREATE TRIGGER on_aluno_deleted_storage_cleanup
  AFTER DELETE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storage_cleanup_on_delete('avatares', 'avatar_url');

DROP TRIGGER IF EXISTS on_aluno_foto_updated_storage_cleanup ON public.alunos;
CREATE TRIGGER on_aluno_foto_updated_storage_cleanup
  AFTER UPDATE ON public.alunos
  FOR EACH ROW
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION public.handle_storage_cleanup_on_update('avatares', 'avatar_url');


-- ════════════════════════════════════════════════════════════════════
-- TRIGGERS — EXERCÍCIOS
-- ════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_exercicio_deleted_storage_cleanup ON public.exercicios;
CREATE TRIGGER on_exercicio_deleted_storage_cleanup
  AFTER DELETE ON public.exercicios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storage_cleanup_on_delete('exercicio-media', 'midia_url');

DROP TRIGGER IF EXISTS on_exercicio_foto_updated_storage_cleanup ON public.exercicios;
CREATE TRIGGER on_exercicio_foto_updated_storage_cleanup
  AFTER UPDATE ON public.exercicios
  FOR EACH ROW
  WHEN (OLD.midia_url IS DISTINCT FROM NEW.midia_url)
  EXECUTE FUNCTION public.handle_storage_cleanup_on_update('exercicio-media', 'midia_url');
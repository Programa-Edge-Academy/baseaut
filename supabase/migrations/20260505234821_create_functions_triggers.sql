-- 20260501_000025_create_functions_triggers.sql


-- ── Trigger 1: criar profile ao registrar usuário em auth.users ────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::tipo_perfil, 'monitor')
  );
  -- Criar preferências padrão para o novo usuário
  INSERT INTO public.preferencias_usuario (usuario_id) VALUES (NEW.id);
  RETURN NEW;
END;$$;


CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Trigger 2: atualizar updated_at em profiles ─────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;


CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER trg_preferencias_updated_at
  BEFORE UPDATE ON public.preferencias_usuario
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Função auxiliar: checar se usuário é coordenador ─────────────────
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coordenador');
$$;


-- ── Função auxiliar: checar se usuário pertence a uma equipe ─────────
CREATE OR REPLACE FUNCTION public.is_team_member(p_equipe_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros_equipe
    WHERE equipe_id = p_equipe_id AND usuario_id = auth.uid() AND status = 'ativo'
  );
$$;

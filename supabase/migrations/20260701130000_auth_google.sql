-- ════════════════════════════════════════════════════════════════════
-- Suporte a cadastro/login por Google
-- ════════════════════════════════════════════════════════════════════
-- handle_new_user passa a aceitar o nome vindo do Google (full_name / name)
-- além do nome_completo enviado pelo formulário próprio, e aproveita o avatar
-- do Google quando disponível.
--
-- Configuração externa necessária (painel Supabase):
--   • Authentication → Providers → Google: ativar e informar os Client
--     IDs/Secret criados no Google Cloud Console, com o redirect
--     https://<projeto>.supabase.co/auth/v1/callback.
--   • Authentication → URL Configuration: adicionar o scheme baseaut://** à
--     lista de Redirect URLs (login nativo volta pelo deep link do app).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nome_completo',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Usuário'
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::tipo_perfil, 'monitor')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.preferencias_usuario (usuario_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;$$;

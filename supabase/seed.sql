INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '220dc117-ac00-4394-90e3-39bf9201380d',
  'authenticated',
  'authenticated',
  'user.coordenador@email.com',
  extensions.crypt('123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '220dc117-ac00-4394-90e3-39bf9201380d',
  '220dc117-ac00-4394-90e3-39bf9201380d',
  format('{"sub":"%s","email":"%s"}', '220dc117-ac00-4394-90e3-39bf9201380d', 'user.coordenador@email.com')::jsonb,
  'email',
  now(), now(), now()
) ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id, 
  nome_completo,
  email,
  role,
  status_conta,
  primeiro_acesso
) VALUES (
  '220dc117-ac00-4394-90e3-39bf9201380d',
  'coordenador',
  'user.coordenador@email.com',
  'coordenador',
  'ativa',       
  false          
) ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  status_conta = EXCLUDED.status_conta,
  primeiro_acesso = EXCLUDED.primeiro_acesso,
  nome_completo = EXCLUDED.nome_completo;

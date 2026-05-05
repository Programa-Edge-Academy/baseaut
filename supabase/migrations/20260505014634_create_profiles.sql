-- Criação da tabela principal de perfis estendendo o auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  role tipo_perfil NOT NULL DEFAULT 'monitor',
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  avatar_url TEXT,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT true,
  status_conta status_conta NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
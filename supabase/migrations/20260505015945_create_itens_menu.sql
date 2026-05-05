-- 20260501_000005_create_itens_menu.sql
CREATE TABLE public.itens_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  rota TEXT NOT NULL UNIQUE,
  icone TEXT,
  permissao_necessaria TEXT NOT NULL REFERENCES public.permissoes (codigo),
  ordem INTEGER NOT NULL DEFAULT 0
);
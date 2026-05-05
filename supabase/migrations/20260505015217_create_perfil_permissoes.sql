-- 20260501_000004_create_perfil_permissoes.sql
CREATE TABLE public.perfil_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_perfil tipo_perfil NOT NULL,
  permissao_id UUID NOT NULL REFERENCES public.permissoes (id) ON DELETE CASCADE,
  UNIQUE (tipo_perfil, permissao_id)
);

-- Seed: Coordenador tem todas as permissões
INSERT INTO public.perfil_permissoes (tipo_perfil, permissao_id)
SELECT 'coordenador', id FROM public.permissoes;

-- Seed: Monitor tem apenas permissões operacionais
INSERT INTO public.perfil_permissoes (tipo_perfil, permissao_id)
SELECT 'monitor', id FROM public.permissoes
WHERE codigo IN (
  'sessao:iniciar', 
  'sessao:visualizar', 
  'exercicio:gerenciar', 
  'circuito:gerenciar',
  'formulario:gerenciar'
);
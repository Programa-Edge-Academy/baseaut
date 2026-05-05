-- 20260501_000003_create_permissoes.sql
CREATE TABLE public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL
);

-- Dados iniciais (seed de permissões do sistema)
INSERT INTO public.permissoes (codigo, descricao) VALUES
  ('equipe:gerenciar', 'Criar e gerenciar equipes'),
  ('aluno:criar', 'Cadastrar novos alunos'),
  ('aluno:editar', 'Editar dados de alunos'),
  ('exercicio:gerenciar', 'Criar e editar exercicios'),
  ('circuito:gerenciar', 'Criar e editar circuitos'),
  ('sessao:iniciar', 'Iniciar sessões de atividade'),
  ('sessao:visualizar', 'Visualizar sessões'),
  ('formulario:gerenciar', 'Criar e editar formulários'),
  ('relatorio:visualizar', 'Visualizar relatórios'),
  ('relatorio:exportar', 'Exportar relatórios'),
  ('usuario:criar', 'Criar novos usuários do sistema');
-- 1. Remove a publicação antiga se ela existir para evitar conflitos no reset
DROP PUBLICATION IF EXISTS powersync;

-- 2. Cria a publicação listando nominalmente as tabelas dos Épicos 1, 2 e 3
CREATE PUBLICATION powersync FOR TABLE 
  public.itens_menu, 
  public.permissoes, 
  public.perfil_permissoes, 
  public.profiles, 
  public.preferencias_usuario, 
  public.membros_equipe, 
  public.equipes, 
  public.alunos, 
  public.circuitos, 
  public.exercicios, 
  public.sessoes, 
  public.itens_circuito, 
  public.execucoes_exercicio, 
  public.registros_suporte;

-- 3. Concede permissão de leitura para a role do PowerSync nas tabelas atuais
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- 4. Garante que futuras tabelas criadas no esquema também tenham essa permissão
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
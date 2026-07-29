-- 1. Criação da Role (Lembre-se: idealmente a senha não ficaria aqui no Git)
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN;
-- A senha será definida via comando externo para não vazar no Git

-- 2. Permissões de Leitura
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- 3. Configuração da Publicação (Exigido pelo PowerSync)
-- Isso permite que o PowerSync escute as mudanças no banco
CREATE PUBLICATION powersync FOR ALL TABLES;

-- 4. Garantir RLS (Regra do Guia)
-- O seu guia exige que o RLS esteja ativo por padrão
-- O powersync_role tem BYPASSRLS, mas suas tabelas DEVEM ter RLS para os usuários finais
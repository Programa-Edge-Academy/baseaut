-- Adiciona coluna de tentativas de verificação à tabela de solicitações de recuperação.
-- Aplicar via: npx supabase db push  ou  SQL Editor no dashboard do Supabase.

alter table solicitacoes_recuperacao
  add column if not exists tentativas int not null default 0;

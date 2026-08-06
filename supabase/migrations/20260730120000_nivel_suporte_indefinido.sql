-- =======================================================================
-- Migration: nível de suporte "Indefinido"
-- =======================================================================
-- O nível de suporte do TEA nem sempre é conhecido no momento do cadastro
-- (laudo ainda não emitido, criança em avaliação). Até aqui o formulário
-- obrigava escolher entre os níveis 1, 2 e 3, o que levava a registrar um
-- nível que ninguém confirmou.
--
-- Passa a existir o valor 'indefinido' no enum. Os registros existentes não
-- são tocados: quem já tem um nível declarado permanece como está.

ALTER TYPE nivel_suporte_tea ADD VALUE IF NOT EXISTS 'indefinido';

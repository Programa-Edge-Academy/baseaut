ALTER TABLE public.sessoes
ADD COLUMN motivo_finalizacao motivo_finalizacao_enum,
ADD COLUMN descricao_motivo TEXT;

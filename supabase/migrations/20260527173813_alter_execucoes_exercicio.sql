-- Migration: alterar tabela execucoes_exercicio com novos campos clínicos

-- Coluna obrigatória: status de realização (ENUM da DB-05)
ALTER TABLE public.execucoes_exercicio
ADD COLUMN status_realizacao status_realizacao_enum NOT NULL;

-- Colunas opcionais: nível de desenvolvimento e registro de ajuda (ENUMs da DB-05)
ALTER TABLE public.execucoes_exercicio
ADD COLUMN nivel_desenvolvimento nivel_desenvolvimento_enum;

ALTER TABLE public.execucoes_exercicio
ADD COLUMN registro_ajuda registro_ajuda_enum;

-- Coluna lista de textos para complementos de ajuda
ALTER TABLE public.execucoes_exercicio
ADD COLUMN complementos_ajuda TEXT[];

-- Coluna motivo de não realização (ENUM da DB-05)
ALTER TABLE public.execucoes_exercicio
ADD COLUMN motivo_nao_realizacao motivo_nao_realizacao_enum;

-- Campo de texto livre para descrições adicionais
ALTER TABLE public.execucoes_exercicio
ADD COLUMN descricao_adicional TEXT;
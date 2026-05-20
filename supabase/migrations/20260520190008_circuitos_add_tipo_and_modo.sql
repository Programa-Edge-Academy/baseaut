CREATE TYPE tipo_circuito_enum AS ENUM ('padrao', 'mabc_1', 'mabc_2', 'mabc_3');

CREATE TYPE modo_execucao_enum AS ENUM ('estruturado', 'livre');

ALTER TABLE public.circuitos
ADD COLUMN tipo tipo_circuito_enum DEFAULT 'padrao',
ADD COLUMN modo_execucao modo_execucao_enum DEFAULT 'livre';
-- 1. NOVOS VALORES NOS ENUM
-- tipo_formulario precisa reconhecer 'mabc2
DO $$ BEGIN
  ALTER TYPE tipo_formulario ADD VALUE IF NOT EXISTS 'mabc2';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- tipo_resposta precisa de 'numerico' para os escores bruto
DO $$ BEGIN
  ALTER TYPE tipo_resposta_formulario ADD VALUE IF NOT EXISTS 'numerico';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Status de cada item individual do MABC-2 (e reutilizável em outros forms
DO $$ BEGIN
  CREATE TYPE status_item_resposta AS ENUM (
    'respondido',
    'adiado',
    'nao_realizado'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ALTERAÇÕES EM TABELA
-- formularios: rastrear template de origem (central para o join de perguntas) e o avaliador que aplicou o instrument
ALTER TABLE formularios
  ADD COLUMN IF NOT EXISTS template_origem_id UUID REFERENCES formularios(id),
  ADD COLUMN IF NOT EXISTS avaliador_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS metadados JSONB;

-- respostas_formulario: suporte a MABC-2 e futuros formulário
ALTER TABLE respostas_formulario
  -- Permite NULL para itens adiados/não realizado
  ALTER COLUMN valor_preenchido DROP NOT NULL,
  -- Nivel de ajuda: {"nivel": "autonomo", "complementos":["verbal", "modelo"]
  ADD COLUMN IF NOT EXISTS valor_ajuda JSONB,
  -- Status de cada ite
  ADD COLUMN IF NOT EXISTS status_item status_item_resposta NOT NULL DEFAULT 'respondido';

-- UNIQUE necessário para o upsert idempotente por (instância, pergunta
ALTER TABLE respostas_formulario
  ADD CONSTRAINT uq_resposta_por_formulario_pergunta UNIQUE (formulario_id, pergunta_id);

-- alunos: mão preferida (dado clínico estável, usado no cabeçalho do MABC-2
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS mao_preferida TEXT
  CHECK (mao_preferida IN ('direita', 'esquerda', 'ambidestro'));
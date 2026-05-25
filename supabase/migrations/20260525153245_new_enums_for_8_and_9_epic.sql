-- Nível de desenvolvimento do aluno na atividade (US9.1)
CREATE TYPE nivel_desenvolvimento_enum AS ENUM (
  'inicial', 'intermediario', 'maduro'
);

-- Registro de Ajuda (US9.1) — substitui ou complementa tipo_suporte
CREATE TYPE registro_ajuda_enum AS ENUM (
  'autonomo', 'ajuda_intrusiva', 'nao_se_aplica'
);

-- Motivo de não realização (US9.2)
CREATE TYPE motivo_nao_realizacao_enum AS ENUM (
  'recusa_aluno',
  'comportamento_disruptivo',
  'fadiga_cansaco',
  'tempo_insuficiente',
  'dificuldade_fisica',
  'outro'
);

-- Status de realização do exercício (US9.2)
CREATE TYPE status_realizacao_enum AS ENUM (
  'realizada', 'nao_realizada'
);

-- Motivo de finalização antecipada de sessão (US8.3)
CREATE TYPE motivo_finalizacao_enum AS ENUM (
  'comportamento_disruptivo',
  'tempo_esgotado',
  'indisposicao_aluno',
  'problema_tecnico',
  'outro'
);
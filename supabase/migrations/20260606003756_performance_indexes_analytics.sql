-- Migration: índices de performance para analytics     

-- sessoes: consultas filtradas por aluno com ordenação temporal
CREATE INDEX IF NOT EXISTS idx_sessoes_aluno_data
  ON sessoes (aluno_id, data_inicio DESC);

-- execucoes_exercicio: filtros por sessão com nível de desenvolvimento preenchido
CREATE INDEX IF NOT EXISTS idx_execucoes_sessao_nivel
  ON execucoes_exercicio (sessao_id, nivel_desenvolvimento)
  WHERE nivel_desenvolvimento IS NOT NULL;

-- execucoes_exercicio: filtros por sessão com registro de ajuda preenchido
CREATE INDEX IF NOT EXISTS idx_execucoes_sessao_ajuda
  ON execucoes_exercicio (sessao_id, registro_ajuda)
  WHERE registro_ajuda IS NOT NULL;

-- formularios: filtros por aluno e tipo excluindo formulários protegidos
CREATE INDEX IF NOT EXISTS idx_formularios_aluno_tipo
  ON formularios (aluno_id, tipo)
  WHERE aluno_id IS NOT NULL AND protegido = FALSE;

-- respostas_formulario: junções entre aluno e formulário
CREATE INDEX IF NOT EXISTS idx_respostas_aluno_formulario
  ON respostas_formulario (aluno_id, formulario_id);

-- comportamentos_sessao: filtros por sessão e tipo de comportamento
CREATE INDEX IF NOT EXISTS idx_comportamentos_sessao_tipo
  ON comportamentos_sessao (sessao_id, tipo);
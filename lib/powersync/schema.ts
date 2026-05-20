import { column, Schema, Table } from '@powersync/react-native';

// BUCKET 1: GLOBAL
const itens_menu = new Table({
  nome: column.text,
  rota: column.text,
  icone: column.text,
  permissao_necessaria: column.text,
  ordem: column.integer
});

const permissoes = new Table({
  codigo: column.text,
  descricao: column.text
});

const perfil_permissoes = new Table({
  tipo_perfil: column.text,
  permissao_id: column.text
});

// BUCKET 2: USER CONTEXT
const profiles = new Table({
  nome_completo: column.text,
  role: column.text,
  email: column.text,
  telefone: column.text,
  avatar_url: column.text,
  primeiro_acesso: column.integer, // boolean
  status_conta: column.text,
  created_at: column.text,
  updated_at: column.text
});

const preferencias_usuario = new Table({
  usuario_id: column.text,
  modo_formulario_padrao: column.text,
  modo_sessao_padrao: column.text,
  created_at: column.text,
  updated_at: column.text
});

// BUCKET 3: TEAM CONTEXT
const equipes = new Table({
  nome: column.text,
  ativa: column.integer, // boolean
  coordenador_id: column.text,
  created_at: column.text
});

const membros_equipe = new Table({
  usuario_id: column.text,
  equipe_id: column.text,
  papel: column.text,
  status: column.text,
  joined_at: column.text
});

const alunos = new Table({
  nome_completo: column.text,
  data_nascimento: column.text, // date
  equipe_id: column.text,
  nivel_suporte: column.text,
  diagnostico_detalhado: column.text,
  observacoes_clinicas: column.text,
  ativo: column.integer, // boolean
  avatar_url: column.text,
  altura: column.real, // numeric
  peso: column.real, // numeric
  cintura: column.real, // numeric
  created_at: column.text,
  updated_at: column.text
});

const circuitos = new Table({
  titulo: column.text,
  descricao: column.text,
  equipe_id: column.text,
  ativo: column.integer, // boolean
  formulario_id: column.text,
  created_at: column.text,
  updated_at: column.text
});

const itens_circuito = new Table({
  circuito_id: column.text,
  exercicio_id: column.text,
  ordem: column.integer,
  duracao_estimada: column.integer,
  repeticoes: column.integer
});

const exercicios = new Table({
  titulo: column.text,
  descricao: column.text,
  equipe_id: column.text,
  midia_url: column.text,
  instrucoes_verbais: column.text,
  ativo: column.integer, // boolean
  created_at: column.text,
  updated_at: column.text
});

const sessoes = new Table({
  aluno_id: column.text,
  equipe_id: column.text,
  monitor_id: column.text,
  circuito_id: column.text,
  formulario_id: column.text,
  status: column.text,
  data_agendada: column.text, // timestamp
  data_inicio: column.text, // timestamp
  data_fim: column.text, // timestamp
  observacoes_gerais: column.text,
  created_at: column.text,
  updated_at: column.text
});

const execucoes_exercicio = new Table({
  sessao_id: column.text,
  exercicio_id: column.text,
  ordem_execucao: column.integer,
  duracao_real_segundos: column.integer,
  tempo_maximo_atingido: column.integer, // boolean
  video_url: column.text,
  created_at: column.text
});

const registros_suporte = new Table({
  execucao_id: column.text,
  tipo: column.text,
  intensidade: column.integer,
  observacao: column.text,
  created_at: column.text
});

export const AppSchema = new Schema({
  itens_menu,
  permissoes,
  perfil_permissoes,
  profiles,
  preferencias_usuario,
  equipes,
  membros_equipe,
  alunos,
  circuitos,
  itens_circuito,
  exercicios,
  sessoes,
  execucoes_exercicio,
  registros_suporte
});

export type Database = (typeof AppSchema)['types'];
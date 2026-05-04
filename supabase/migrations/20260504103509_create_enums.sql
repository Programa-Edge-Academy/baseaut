-- Perfis de usuário do sistema 
CREATE TYPE tipo_perfil AS ENUM ('coordenador', 'monitor');

-- Ciclo de vida da conta de usuário
CREATE TYPE status_conta AS ENUM ('pendente', 'ativa', 'bloqueada');

-- Canal de envio do código de recuperação de senha
CREATE TYPE canal_recuperacao AS ENUM ('email', 'telefone');

-- Nivel de suporte TEA do aluno
CREATE TYPE nivel_suporte_tea AS ENUM ('nivel_1', 'nivel_2', 'nivel_3');

-- Tipo de suporte/ajuda oferecido ao aluno durante uma execução
CREATE TYPE tipo_suporte AS ENUM ('independente', 'visual', 'verbal', 'fisico');

-- Estado de uma sessão de atividades
CREATE TYPE status_sessao AS ENUM ('em_andamento', 'concluida', 'cancelada');

-- Estado de um membro dentro de uma equipe
CREATE TYPE status_membro AS ENUM ('ativo', 'pendente', 'removido');

-- Modo de exibição do formulário durante a sessão
CREATE TYPE modo_formulario AS ENUM ('durante', 'ao_final', 'desativado');
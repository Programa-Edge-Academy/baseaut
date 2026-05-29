-- ════════════════════════════════════════════════════════════════════
-- SEED-03 — Template global do Registro de Controle (RC)
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: Criar o formulário padrão do PEFaut para sessões.
-- Sem aluno_id (template global) e com protegido = true.
-- O front-end usará este ID na criação do circuito.
-- ════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE 
  v_form_id UUID := '00000000-0000-4000-0000-0000000000fc';
BEGIN
  -- 1. Cria a capa do formulário (Template Global)
  INSERT INTO public.formularios (
    id, titulo, descricao, tipo, equipe_id, protegido, ativo
  )
  SELECT
    v_form_id,
    'Registro de Controle - PEFaut',
    'Formulário padrão de registro de controle da sessão (comportamentos, fugas e engajamento).',
    'registro_controle',
    id,   -- equipe_id (pega a primeira equipe padrão)
    true, -- protegido contra alterações do usuário
    true  -- ativo
  FROM public.equipes LIMIT 1
  ON CONFLICT DO NOTHING;

  -- 2. Insere as perguntas traduzidas do Google Forms
  INSERT INTO public.perguntas (
    formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida
  )
  VALUES
    -- Bloco 1: Tempo
    (v_form_id, 'Tempo da sessão', 'texto_curto', null, true, 1, true),
    
    -- Bloco 2: Engajamento Visual (Grid Sim/Não)
    (v_form_id, 'Contato visual - Pessoas', 'selecao_unica', '{"valores": ["Sim", "Não"]}'::jsonb, true, 2, true),
    (v_form_id, 'Contato visual - Objetos', 'selecao_unica', '{"valores": ["Sim", "Não"]}'::jsonb, true, 3, true),
    
    -- Bloco 3: Comportamentos
    (v_form_id, 'Comportamentos Estereotipados', 'multipla_escolha', '{"valores": ["Corridas de um lugar a outro", "Saltos no mesmo lugar", "Balanceio", "Olha e brinca com as mãos e os dedos", "Pontapés", "Faz caretas", "Roda objetos ou sobre si mesmo", "Caminha na ponta dos pés ou saltando", "Arrasta os pés", "Torce o corpo", "Nenhuma das opções"]}'::jsonb, true, 4, true),
    (v_form_id, 'Comportamentos Inaptos', 'multipla_escolha', '{"valores": ["Cabeçada", "Pegada na roupa", "Chute", "Tapa", "Mordida", "Puxar cabelo", "Beliscar", "Nenhuma das opções"]}'::jsonb, true, 5, true),
    
    -- Bloco 4: Fugas
    (v_form_id, 'Fugas (número de fugas e tempo do ocorrido)', 'texto_curto', null, true, 6, true),
    
    -- Bloco 5: Atividade Preferencial (Grid Sim/Não)
    (v_form_id, 'Atividade Preferencial - Manipulativa', 'selecao_unica', '{"valores": ["Sim", "Não"]}'::jsonb, true, 7, true),
    (v_form_id, 'Atividade Preferencial - Equilíbrio', 'selecao_unica', '{"valores": ["Sim", "Não"]}'::jsonb, true, 8, true),
    (v_form_id, 'Atividade Preferencial - Força', 'selecao_unica', '{"valores": ["Sim", "Não"]}'::jsonb, true, 9, true),
    
    -- Bloco 6: Primeira vez
    (v_form_id, 'Atividade de engajamento realizada pela 1ª vez (Descreva atividade, tipo de ajuda física e tempo)', 'texto_longo', null, false, 10, true)
  ON CONFLICT DO NOTHING;

END $$;
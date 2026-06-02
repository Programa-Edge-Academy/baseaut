-- Regra de modelagem: cada item fisico = 1 pergunta com tipo_resposta=numerico
-- O campo opcoes JSONB carrega metadados para o front renderizar os componentes corretos e para as RPCs de analytics agruparem resultados por componente.
DO $$
DECLARE
  v_f1 UUID;
  v_f2 UUID;
  v_f3 UUID;
BEGIN
  -- TEMPLATE 1: MABC-2 Faixa 1 (3 a 6 Anos)
  INSERT INTO formularios (titulo, descricao, tipo, protegido, ativo, metadados)
  VALUES (
    'MABC-2 Faixa 1 (3 a 6 anos)',
    'Movement ABC-2 2ª edição. Grupo de Idade 1. Escore Bruto (melhor tentativa) coletado pelo avaliador. Conversão para Escore-Pa',
    'mabc2', TRUE, TRUE,
    '{"faixa_mabc": 1}'::JSONB
  ) RETURNING id INTO v_f1;

  INSERT INTO perguntas (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  VALUES
    -- Destreza Manual
    (v_f1, 'DM 1 Colocar Moedas no Cofre (Mão Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1","sub_item":"mao_preferida", "unidade": "seg", "faixa":1}'::JSONB, TRUE, 10, TRUE),
    (v_f1, 'DM 1 Colocar Moedas no Cofre (Mão Não Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1","sub_item":"mao_nao_preferida", "unidade": "seg", "faixa":1}'::JSONB, TRUE, 20, TRUE),
    (v_f1, 'DM 2 Entrelaçar os Cubos com o Cordão', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM2", "unidade": "seg", "faixa":1}'::JSONB, TRUE, 30, TRUE),
    (v_f1, 'DM 3 Desenhar o Caminho 1', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM3", "unidade":"seg", "faixa":1}'::JSONB, TRUE, 40, TRUE),
    
    -- Mirar e Pegar
    (v_f1, 'MP 1 Pegar o Saquinho de Feijão', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item":"MP1", "unidade": "tentativas", "faixa":1}'::JSONB, TRUE, 50, TRUE),
    (v_f1, 'MP 2 Arremessar o Saquinho de Feijão no Tapete', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item": "MP2", "unidade": "tentativas", "faixa":1}'::JSONB, TRUE, 60, TRUE),
    
    -- Equilíbrio
    (v_f1, 'E 1 Equilibrio em Uma Perna Só (Melhor Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item": "E1","sub_item":"melhor_perna", "unidade": "seg", "faixa":1}'::JSONB, TRUE, 70, TRUE),
    (v_f1, 'E 1 Equilibrio em Uma Perna Só (Outra Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E1","sub_item": "outra_perna", "unidade":"seg", "faixa":1}'::JSONB, TRUE, 80, TRUE),
    (v_f1, 'E 2 Caminhar na Ponta dos Pés', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E2", "unidade": "seg", "faixa":1}'::JSONB, TRUE, 90, TRUE),
    (v_f1, 'E 3 Saltar nos Tapetes', 'numerico',
     '{"componente": "equilibrio", "codigo_item": "E3", "unidade": "tentativas", "faixa":1}'::JSONB, TRUE, 100, TRUE);

  -- TEMPLATE 2: MABC-2 Faixa 2 (7 a 10 Anos)
  INSERT INTO formularios (titulo, descricao, tipo, protegido, ativo, metadados)
  VALUES (
    'MABC-2 Faixa 2 (7 a 10 anos)',
    'Movement ABC-2 2ª edição. Grupo de Idade 2. Escore Bruto (melhor tentativa) coletado pelo avaliador. Conversão para Escore-Pa',
    'mabc2', TRUE, TRUE,
    '{"faixa_mabc": 2}'::JSONB
  ) RETURNING id INTO v_f2;

  INSERT INTO perguntas (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  VALUES
    -- Destreza Manual
    (v_f2, 'DM 1 Colocar os Pinos no Tabuleiro (Mão Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1","sub_item":"mao_preferida", "unidade": "seg", "faixa": 2}'::JSONB, TRUE, 10, TRUE),
    (v_f2, 'DM 1 Colocar os Pinos no Tabuleiro (Mão Não Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1", "sub_item":"mao_nao_preferida", "unidade": "seg", "faixa":2}'::JSONB, TRUE, 20, TRUE),
    (v_f2, 'DM 2 Entrelaçar o Cordão', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM2", "unidade": "seg", "faixa": 2}'::JSONB, TRUE, 30, TRUE),
    (v_f2, 'DM 3 Desenhar o Caminho 2', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM3", "unidade": "seg", "faixa":2}'::JSONB, TRUE, 40, TRUE),
    
    -- Mirar e Pegar
    (v_f2, 'MP 1 Pegar com as Duas Mãos', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item": "MP1", "unidade": "tentativas", "faixa": 2}'::JSONB, TRUE, 50, TRUE),
    (v_f2, 'MP 2 Arremessar o Saquinho de Feijão no Tapete', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item": "MP2", "unidade": "tentativas", "faixa": 2}'::JSONB, TRUE, 60, TRUE),
    
    -- Equilíbrio
    (v_f2, 'E 1 Equilíbrio sobre uma Prancha (Melhor Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E1", "sub_item":"melhor_perna", "unidade": "seg", "faixa": 2}'::JSONB, TRUE, 70, TRUE),
    (v_f2, 'E 1 Equilíbrio sobre uma Prancha (Outra Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E1", "sub_item": "outra_perna", "unidade": "seg", "faixa": 2}'::JSONB, TRUE, 80, TRUE),
    (v_f2, 'E 2 Caminhar para Frente Calcanhar-Dedos', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E2", "unidade": "seg", "faixa":2}'::JSONB, TRUE, 90, TRUE),
    (v_f2, 'E 3 Saltar com Um Pé nos Tapetes (Melhor Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E3", "sub_item":"melhor_perna", "unidade": "tentativas", "faixa": 2}'::JSONB, TRUE, 100, TRUE),
    (v_f2, 'E 3 Saltar com Um Pé nos Tapetes (Outra Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E3", "sub_item": "outra_perna", "unidade": "tentativas", "faixa":2}'::JSONB, TRUE, 110, TRUE);

  -- TEMPLATE 3: MABC-2 Faixa 3 (11 a 16 Anos)
  INSERT INTO formularios (titulo, descricao, tipo, protegido, ativo, metadados)
  VALUES (
    'MABC-2 Faixa 3 (11 a 16 anos)',
    'Movement ABC-2 2ª edição. Grupo de Idade 3. Escore Bruto (melhor tentativa) coletado pelo avaliador. Conversão para Escore-Pa',
    'mabc2', TRUE, TRUE,
    '{"faixa_mabc": 3}'::JSONB
  ) RETURNING id INTO v_f3;

  INSERT INTO perguntas (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  VALUES
    -- Destreza Manual
    (v_f3, 'DM 1 Virar os Pinos (Mão Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1","sub_item":"mao_preferida", "unidade":"seg", "faixa":3}'::JSONB, TRUE, 10, TRUE),
    (v_f3, 'DM 1 Virar os Pinos (Mão Não Preferida)', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM1", "sub_item":"mao_nao_preferida", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 20, TRUE),
    (v_f3, 'DM 2 Triângulo com Porcas e Parafusos', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM2", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 30, TRUE),
    (v_f3, 'DM 3 Desenhar o Caminho 3', 'numerico',
     '{"componente": "destreza_manual", "codigo_item": "DM3", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 40, TRUE),
    
    -- Mirar e Pegar
    (v_f3, 'MP 1 Pegar com Uma Mão (Melhor Mão)', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item": "MP1","sub_item":"melhor_mao", "unidade": "tentativas", "faixa":3}'::JSONB, TRUE, 50, TRUE),
    (v_f3, 'MP 1 Pegar com Uma Mão (Outra Mão)', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item": "MP1","sub_item": "outra_mao", "unidade": "tentativas", "faixa":3}'::JSONB, TRUE, 60, TRUE),
    (v_f3, 'MP 2 Arremessar em um Alvo na Parede', 'numerico',
     '{"componente": "mirar_pegar", "codigo_item":"MP2", "unidade": "tentativas", "faixa":3}'::JSONB, TRUE, 70, TRUE),
    
    -- Equilíbrio
    (v_f3, 'E 1 Equilíbrio sobre Duas Pranchas', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E1", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 80, TRUE),
    (v_f3, 'E 2 Caminhar para Trás Dedos-Calcanhar', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E2", "unidade": "passos", "faixa":3}'::JSONB, TRUE, 90, TRUE),
    (v_f3, 'E 3 Saltar com Um Pé em Zigue-Zague (Melhor Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E3", "sub_item":"melhor_perna", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 100, TRUE),
    (v_f3, 'E 3 Saltar com Um Pé em Zigue-Zague (Outra Perna)', 'numerico',
     '{"componente": "equilibrio", "codigo_item":"E3", "sub_item": "outra_perna", "unidade": "seg", "faixa":3}'::JSONB, TRUE, 110, TRUE);
END $$;
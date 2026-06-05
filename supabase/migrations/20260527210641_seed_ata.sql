-- ATA: 23 seções (I–XXIII), cada uma pontuada 0/1/2.
-- Ponto de corte diagnóstico: 15 pontos. Pontuação máxima: 46.

DO $$
DECLARE
  v_id UUID := '00000000-0000-4a7a-0000-000000000a7a';
  v_opcoes JSONB := '{"min":0,"max":2}'::jsonb;
BEGIN

  INSERT INTO public.formularios
    (id, titulo, descricao, tipo, equipe_id, aluno_id, protegido, ativo)
  VALUES (
    v_id,
    'ATA — Escala de Traços Autísticos',
    'Ballabriga et al., 1994; adapt. Assumpção et al., 1999. 23 domínios, pontuação 0/1/2. Ponto de corte: 15.',
    'ata',
    NULL,
    NULL,
    true,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.perguntas
    (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  VALUES

    -- I
    (v_id,
     'I — Dificuldade na interação social'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não sorri; ausência de aproximações espontâneas; não busca companhia; '
     || 'busca esconderijo; evita pessoas; incapaz de manter intercâmbio social; isolamento intenso.',
     'escala_inteira', v_opcoes, true, 1, true),

    -- II
    (v_id,
     'II — Manipulação do ambiente'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não responde às solicitações; mudança repentina de humor; indiferente sem expressão; '
     || 'risos compulsivos; birra e raiva passageira; excitação motora ou verbal.',
     'escala_inteira', v_opcoes, true, 2, true),

    -- III
    (v_id,
     'III — Utilização das pessoas a seu redor'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: usa o adulto como objeto; adulto como apoio; adulto como meio para suprir necessidade; '
     || 'interfere na conduta do adulto quando não atendido.',
     'escala_inteira', v_opcoes, true, 3, true),

    -- IV
    (v_id,
     'IV — Resistência a mudanças'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: insistente em manter a rotina; grande dificuldade em aceitar mudanças de lugar, '
     || 'vestuário ou alimentação; persiste na mesma resposta ou atividade.',
     'escala_inteira', v_opcoes, true, 4, true),

    -- V
    (v_id,
     'V — Busca de uma ordem rígida'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: ordena objetos por critérios próprios; prende-se a ordenação espacial; '
     || 'prende-se a sequência temporal; correspondência pessoa-lugar rígida.',
     'escala_inteira', v_opcoes, true, 5, true),

    -- VI
    (v_id,
     'VI — Falta de contato visual / olhar indefinido'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: desvia olhares diretos; vira a cabeça quando chamado; olhar vazio e sem vida; '
     || 'segue estímulos de forma intermitente; fixa objetos com olhar periférico; dá sensação de não olhar.',
     'escala_inteira', v_opcoes, true, 6, true),

    -- VII
    (v_id,
     'VII — Mímica inexpressiva'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não usa expressão facial ou gestual ao falar; sem reação antecipatória; '
     || 'não expressa pela mímica o que quer ou sente; imobilidade facial.',
     'escala_inteira', v_opcoes, true, 7, true),

    -- VIII
    (v_id,
     'VIII — Distúrbios de sono'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não quer ir dormir; levanta-se muito cedo; sono irregular; troca o dia pela noite; '
     || 'dorme poucas horas.',
     'escala_inteira', v_opcoes, true, 8, true),

    -- IX
    (v_id,
     'IX — Alteração na alimentação'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: seletividade alimentar rígida; come objetos não alimentares; não mastigava quando pequeno; '
     || 'atividade ruminante; vômitos; come grosseiramente; rituais alimentares; ausência de paladar.',
     'escala_inteira', v_opcoes, true, 9, true),

    -- X
    (v_id,
     'X — Dificuldade no controle dos esfíncteres'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: medo de sentar no vaso; usa esfíncteres para manipular o adulto; '
     || 'usa como estimulação corporal; controle diurno presente mas noturno tardio ou ausente.',
     'escala_inteira', v_opcoes, true, 10, true),

    -- XI
    (v_id,
     'XI — Exploração dos objetos (apalpar, chupar)'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: morde e engole objetos não alimentares; chupa e coloca coisas na boca; '
     || 'cheira tudo; apalpa superfícies minuciosamente.',
     'escala_inteira', v_opcoes, true, 11, true),

    -- XII
    (v_id,
     'XII — Uso inapropriado dos objetos'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: ignora objetos ou interesse momentâneo; golpeia ou atira; conduta atípica; '
     || 'carrega obsessivamente certo objeto; interesse em parte do objeto; coleciona objetos estranhos; '
     || 'usa objetos de forma inadequada.',
     'escala_inteira', v_opcoes, true, 12, true),

    -- XIII
    (v_id,
     'XIII — Falta de atenção'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: atenção por curto espaço de tempo; age como surdo; tempo de latência aumentado; '
     || 'resposta retardada; sensação de ausência frequente.',
     'escala_inteira', v_opcoes, true, 13, true),

    -- XIV
    (v_id,
     'XIV — Ausência de interesse pela aprendizagem'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não quer aprender; cansa-se rapidamente; esquece rápido; insiste em ser ajudado '
     || 'mesmo sabendo; insiste constantemente em mudar de atividade.',
     'escala_inteira', v_opcoes, true, 14, true),

    -- XV
    (v_id,
     'XV — Falta de iniciativa'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: incapaz de ter iniciativa própria; busca comodidade; passividade e falta de interesse; '
     || 'lentidão; prefere que outro faça o trabalho.',
     'escala_inteira', v_opcoes, true, 15, true),

    -- XVI
    (v_id,
     'XVI — Alteração de linguagem e comunicação'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: mutismo; estereotipias vocais; entonação incorreta; ecolalia imediata e/ou retardada; '
     || 'repetição de palavras ou frases; sons estereotipados sem razão aparente; '
     || 'não se comunica por gestos; interações sem diálogo.',
     'escala_inteira', v_opcoes, true, 16, true),

    -- XVII
    (v_id,
     'XVII — Não manifesta habilidades e conhecimentos'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não realiza se não quiser; não demonstra o que sabe sem necessidade específica; '
     || 'demonstra habilidades somente em lugares/pessoas determinados; '
     || 'surpreende por habilidades inesperadas.',
     'escala_inteira', v_opcoes, true, 17, true),

    -- XVIII
    (v_id,
     'XVIII — Reações inapropriadas ante a frustração'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: desagrado se algo é esquecido; desagrado se atividade é interrompida; '
     || 'desgosto quando desejos não se cumprem; reações de birra.',
     'escala_inteira', v_opcoes, true, 18, true),

    -- XIX
    (v_id,
     'XIX — Não assume responsabilidades'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não assume nenhuma responsabilidade por menor que seja; '
     || 'necessita que se repita muitas vezes ou eleve o tom de voz para realizar algo.',
     'escala_inteira', v_opcoes, true, 19, true),

    -- XX
    (v_id,
     'XX — Hiperatividade / Hipoatividade'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: constantemente em movimento; mesmo estimulado não se move; barulhento; '
     || 'vai de um lugar a outro sem parar; fica pulando no mesmo lugar; não sai do lugar.',
     'escala_inteira', v_opcoes, true, 20, true),

    -- XXI
    (v_id,
     'XXI — Movimentos estereotipados e repetitivos'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: balanceia-se; olha e brinca com mãos/dedos; tapa olhos e orelhas; dá pontapés; '
     || 'faz caretas e movimentos estranhos com a face; roda objetos ou sobre si mesmo; '
     || 'caminha na ponta dos pés ou com movimentos estranhos; torce o corpo ou mantém postura desequilibrada.',
     'escala_inteira', v_opcoes, true, 21, true),

    -- XXII
    (v_id,
     'XXII — Ignora o perigo'
     || E'\n(0=nenhum | 1=um sintoma | 2=mais de um)\n'
     || 'Indicadores: não se dá conta do perigo; sobe em todos os lugares; parece insensível à dor.',
     'escala_inteira', v_opcoes, true, 22, true),

    -- XXIII
    (v_id,
     'XXIII — Aparecimento dos sintomas antes dos 36 meses (DSM-IV)'
     || E'\n(0=não | 1=sim para um domínio | 2=sim para mais de um domínio)\n'
     || 'Indicadores: alterações de linguagem, estereotipias e/ou contato visual manifestas antes dos 3 anos.',
     'escala_inteira', v_opcoes, true, 23, true)

  ON CONFLICT DO NOTHING;

END $$;
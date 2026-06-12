-- =======================================================================
-- Seed: Carga das Descrições em Markdown para CARS e ATA
-- =======================================================================
-- Atualiza os registros existentes buscando pelo prefixo da pergunta.

UPDATE public.perguntas AS p
SET descricao = d.markdown_conteudo
FROM (VALUES

  -- =====================================================================
  -- PROTOCOLO CARS (15 Domínios)
  -- =====================================================================
  (
    'I — Relação com pessoas',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Sem evidência de anomalia ou dificuldade na relação com as pessoas.\n' ||
    '* **2.0 (Ligeiramente anormal):** Alguma timidez, agitação ou aborrecimento pode ser observada, mas não superior ao esperado para a idade.\n' ||
    '* **3.0 (Moderadamente anormal):** A criança mostra-se distante ignorando os adultos e parecendo ausente por momentos. Esforços são necessários para prender sua atenção.\n' ||
    '* **4.0 (Severamente anormal):** Distante e desinteressada do que o adulto está a fazer. Quase nunca inicia ou responde ao contacto.'
  ),
  (
    'II — Imitação',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Imitação apropriada de sons, palavras e movimentos.\n' ||
    '* **2.0 (Ligeiramente anormal):** Imita comportamentos simples na maior parte das vezes, ocasionalmente necessita de estímulo ou apresenta atraso.\n' ||
    '* **3.0 (Moderadamente anormal):** Imita só parte do tempo, requerendo grande persistência e ajuda do adulto.\n' ||
    '* **4.0 (Severamente anormal):** Raramente ou nunca imita sons, palavras ou movimentos mesmo com a ajuda do adulto.'
  ),
  (
    'III — Resposta emocional',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Respostas adequadas à idade e à situação (expressão facial, postura).\n' ||
    '* **2.0 (Ligeiramente anormal):** Ocasionalmente desenvolve reação desajustada. Reações muitas vezes não relacionadas com os acontecimentos.\n' ||
    '* **3.0 (Moderadamente anormal):** Reações muito apagadas ou excessivas. Pode gritar ou rir sem motivo aparente.\n' ||
    '* **4.0 (Severamente anormal):** Raramente a resposta é adequada. Pode manifestar diferentes emoções num curto espaço de tempo, mesmo sem alterações no ambiente.'
  ),
  (
    'IV — Uso corporal',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Move-se com a facilidade, agilidade e coordenação esperada para a idade.\n' ||
    '* **2.0 (Ligeiramente anormal):** Algumas peculiaridades (desajeitada, movimentos repetitivos leves, coordenação pobre).\n' ||
    '* **3.0 (Moderadamente anormal):** Comportamentos nitidamente estranhos (movimentos finos dos dedos, autoagressão, balanceio, rodopiar, marcha em bicos de pés).\n' ||
    '* **4.0 (Severamente anormal):** Movimentos anormais muito frequentes e intensos. Persistem mesmo quando se tenta inibir ou envolver a criança noutra atividade.'
  ),
  (
    'V — Uso de objectos',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Interesse e uso apropriados de brinquedos.\n' ||
    '* **2.0 (Ligeiramente anormal):** Menos interesse que o normal ou uso infantil (ex: levar à boca em idade não aceitável).\n' ||
    '* **3.0 (Moderadamente anormal):** Preocupação em utilizá-los de modo estranho (foco em parte insignificante, fascinação por reflexo de luz, mover repetidamente).\n' ||
    '* **4.0 (Severamente anormal):** Comportamento anômalo frequente e intenso. Muito difícil de ser alterado ou desligado da atividade.'
  ),
  (
    'VI — Adaptação à mudança',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Pode reagir à mudança de rotina, mas aceita sem stress desajustado.\n' ||
    '* **2.0 (Ligeiramente anormal):** Pode resistir à mudança, mas a atenção é desviada facilmente e acalma-se.\n' ||
    '* **3.0 (Moderadamente anormal):** Resiste ativamente às mudanças de rotina. Fica zangada e infeliz quando a rotina é alterada.\n' ||
    '* **4.0 (Severamente anormal):** Reação intensa e difícil de eliminar. Se a mudança é imposta, fica extremamente zangada e com birras.'
  ),
  (
    'VII — Resposta visual',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Comportamento visual normal. Visão usada em conjunto com outros sentidos.\n' ||
    '* **2.0 (Ligeiramente anormal):** Tem de ser lembrada de olhar. Pode fixar espelhos/luzes, ficar com olhar ausente ou evitar contato visual ocasionalmente.\n' ||
    '* **3.0 (Moderadamente anormal):** Olhar fixo, ausente. Evita contato visual, olha objetos de ângulo estranho ou muito perto dos olhos.\n' ||
    '* **4.0 (Severamente anormal):** Evita constantemente olhar para as pessoas ou certos objetos e mostra formas extremas das peculiaridades acima.'
  ),
  (
    'VIII — Resposta auditiva ao som',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Comportamento auditivo normal.\n' ||
    '* **2.0 (Ligeiramente anormal):** Falta de resposta a alguns sons ou ligeiramente exagerada para outros. Resposta atrasada ocasional.\n' ||
    '* **3.0 (Moderadamente anormal):** Ignora o som inicialmente. Pode assustar-se com sons do dia-a-dia e tapar os ouvidos.\n' ||
    '* **4.0 (Severamente anormal):** Hiper ou hiporreação de modo extremo, independentemente do tipo de som.'
  ),
  (
    'IX — Resposta ao paladar, olfacto e tacto',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Explora objetos novos de modo apropriado. Reação normal a estímulos de dor (queda, pancada).\n' ||
    '* **2.0 (Ligeiramente anormal):** Persiste em levar à boca/cheirar objetos não comestíveis. Reação levemente excessiva ou ignorada a dores ligeiras.\n' ||
    '* **3.0 (Moderadamente anormal):** Moderadamente preocupada em tocar, cheirar ou saborear objetos/pessoas. Reação anormal à dor.\n' ||
    '* **4.0 (Severamente anormal):** Preocupada em cheirar/saborear/tocar puramente pela sensação física. Ignora dor ou reage de forma extrema.'
  ),
  (
    'X — Medo ou ansiedade',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Comportamento adequado à situação.\n' ||
    '* **2.0 (Ligeiramente anormal):** Ocasionalmente revela medo ou ansiedade ligeiramente desajustada.\n' ||
    '* **3.0 (Moderadamente anormal):** Resposta excessiva ou inferior ao esperado. Difícil de entender o motivo e difícil de confortar.\n' ||
    '* **4.0 (Severamente anormal):** Medos persistem após repetidas experiências sem perigo. Ou, pelo contrário, ausência total de receio em situações perigosas (cães estranhos, trânsito).'
  ),
  (
    'XI — Comunicação verbal',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Normal em relação à idade.\n' ||
    '* **2.0 (Ligeiramente anormal):** Atraso global. Ecolalias e troca de pronomes ocasionais após a idade esperada. Palavras peculiares/jargão ocasionais.\n' ||
    '* **3.0 (Moderadamente anormal):** Linguagem ausente ou mistura de linguagem com ecolalia/jargão. Repetição sem fins comunicativos (falas de TV). Preocupação com tópicos específicos.\n' ||
    '* **4.0 (Severamente anormal):** Não há linguagem com sentido. Gritos, sons bizarros ou imitação de linguagem sem significado. Uso persistente e bizarro de frases.'
  ),
  (
    'XII — Comunicação não verbal',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Adequada à idade.\n' ||
    '* **2.0 (Ligeiramente anormal):** Comunicação não verbal imatura. Aponta vagamente para o que pretende.\n' ||
    '* **3.0 (Moderadamente anormal):** Incapaz de exprimir necessidades de modo não verbal ou entender os outros. Pode levar o adulto pela mão, mas não aponta.\n' ||
    '* **4.0 (Severamente anormal):** Usa somente gestos peculiares e bizarros sem significado. Não compreende expressões faciais ou gestos dos outros.'
  ),
  (
    'XIII — Nível de actividade',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Atividade compatível com a idade e circunstâncias.\n' ||
    '* **2.0 (Ligeiramente anormal):** Ligeiramente irrequieta ou lenta, mas passível de redirecionamento e encorajamento.\n' ||
    '* **3.0 (Moderadamente anormal):** Muito ativa e difícil de conter (energia ilimitada) OU completamente letárgica e preguiçosa para atividades físicas.\n' ||
    '* **4.0 (Severamente anormal):** Extremos de hiperatividade (necessitando de controle constante) ou inatividade letárgica severa.'
  ),
  (
    'XIV — Nível e consistência da resposta intelectual',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Inteligência sobreponível às crianças da mesma idade.\n' ||
    '* **2.0 (Ligeiramente anormal):** Não é tão desperta, capacidades parecem ligeiramente atrasadas em todas as áreas.\n' ||
    '* **3.0 (Moderadamente anormal):** Globalmente não é tão esperta quanto os pares, contudo, em uma ou mais áreas pode funcionar próximo do normal.\n' ||
    '* **4.0 (Severamente anormal):** Pode funcionar muito melhor que as crianças da sua idade em áreas específicas, apresentando talentos invulgares (música, arte, números).'
  ),
  (
    'XV — Impressão global',
    '### Diretrizes de Pontuação\n\n' ||
    '* **1.0 (Normal):** Sem autismo. Não mostra sintomas característicos.\n' ||
    '* **2.0 (Ligeiramente anormal):** Autismo ligeiro. Revela poucos sintomas ou grau leve.\n' ||
    '* **3.0 (Moderadamente anormal):** Autismo moderado. Mostra alguns sintomas ou grau moderado.\n' ||
    '* **4.0 (Severamente anormal):** Autismo severo. Revela muitos sintomas ou grau extremo.'
  ),

  -- =====================================================================
  -- PROTOCOLO ATA (23 Domínios - Extração das Introduções Clínicas)
  -- =====================================================================
  (
    'I — Dificuldade na interação social',
    '### Diretriz Clínica\n\n' ||
    '> O desvio da sociabilidade pode oscilar entre formas leves como, por exemplo, um certo negativismo e a evitação do contato ocular, até formas mais graves, como um intenso isolamento.'
  ),
  (
    'II — Manipulação do ambiente',
    '### Diretriz Clínica\n\n' ||
    '> O problema da manipulação do ambiente pode apresentar-se em nível mais ou menos grave, como não responder às solicitações e manter-se indiferente. O fato mais comum é a manifestação brusca de crises de birra passageira, risos incontroláveis e sem motivo, tudo isto com o fim de conseguir ser o centro da atenção.'
  ),
  (
    'III — Utilização das pessoas a seu redor',
    '### Diretriz Clínica\n\n' ||
    '> A relação que mantém com o adulto quase nunca é interativa, dado que normalmente se utiliza do adulto como o meio para conseguir o que deseja.'
  ),
  (
    'IV — Resistência a mudanças',
    '### Diretriz Clínica\n\n' ||
    '> A resistência a mudanças pode variar da irritabilidade até franca recusa.'
  ),
  (
    'V — Busca de uma ordem rígida',
    '### Diretriz Clínica\n\n' ||
    '> Manifesta tendência a ordenar tudo, podendo chegar a uma conduta de ordem obsessiva, sem a qual não consegue desenvolver nenhuma atividade.'
  ),
  (
    'VI — Falta de contato visual / olhar indefinido',
    '### Diretriz Clínica\n\n' ||
    '> A falta de contato pode variar desde um olhar estranho até constante evitação dos estímulos visuais.'
  ),
  (
    'VII — Mímica inexpressiva',
    '### Diretriz Clínica\n\n' ||
    '> A inexpressividade mímica revela a carência da comunicação não verbal. Pode apresentar, desde uma certa expressividade, até uma ausência total de resposta.'
  ),
  (
    'VIII — Distúrbios de sono',
    '### Diretriz Clínica\n\n' ||
    '> Quando pequeno dorme muitas horas e, quando maior, dorme poucas horas, se comparado ao padrão esperado para a idade. Esta conduta pode ser constante, ou não.'
  ),
  (
    'IX — Alteração na alimentação',
    '### Diretriz Clínica\n\n' ||
    '> Pode ser quantitativa e/ou qualitativa. Pode incluir situações, desde aquela em que a criança deixa de se alimentar, até aquela em que se opõe ativamente.'
  ),
  (
    'X — Dificuldade no controle dos esfíncteres',
    '### Diretriz Clínica\n\n' ||
    '> O controle dos esfíncteres pode existir, porém a sua utilização pode ser uma forma de manipular ou chamar a atenção do adulto.'
  ),
  (
    'XI — Exploração dos objetos (apalpar, chupar)',
    '### Diretriz Clínica\n\n' ||
    '> Analisa os objetos sensorialmente, requisitando mais os outros órgãos dos sentidos em detrimento da visão, porém sem uma finalidade específica.'
  ),
  (
    'XII — Uso inapropriado dos objetos',
    '### Diretriz Clínica\n\n' ||
    '> Não utiliza os objetos de modo funcional, mas sim de uma forma bizarra.'
  ),
  (
    'XIII — Falta de atenção',
    '### Diretriz Clínica\n\n' ||
    '> Dificuldades na atenção e concentração. Às vezes, fixa a atenção em suas próprias produções sonoras ou motoras, dando a sensação de que se encontra ausente.'
  ),
  (
    'XIV — Ausência de interesse pela aprendizagem',
    '### Diretriz Clínica\n\n' ||
    '> Não tem nenhum interesse por aprender, buscando solução nos demais. Aprender representa um esforço de atenção e de intercâmbio pessoal, é uma ruptura em sua rotina.'
  ),
  (
    'XV — Falta de iniciativa',
    '### Diretriz Clínica\n\n' ||
    '> Busca constantemente a comodidade e espera que lhe dêem tudo pronto. Não realiza nenhuma atividade funcional por iniciativa própria.'
  ),
  (
    'XVI — Alteração de linguagem e comunicação',
    '### Diretriz Clínica\n\n' ||
    '> É uma característica fundamental do autismo, que pode variar desde um atraso de linguagem até formas mais graves, com uso exclusivo de fala particular e estranha.'
  ),
  (
    'XVII — Não manifesta habilidades e conhecimentos',
    '### Diretriz Clínica\n\n' ||
    '> Nunca manifesta tudo aquilo que é capaz de fazer ou agir, no que diz respeito a seus conhecimentos e habilidades, dificultando a avaliação dos profissionais.'
  ),
  (
    'XVIII — Reações inapropriadas ante a frustração',
    '### Diretriz Clínica\n\n' ||
    '> Manifesta desde o aborrecimento à reação de cólera, ante a frustração.'
  ),
  (
    'XIX — Não assume responsabilidades',
    '### Diretriz Clínica\n\n' ||
    '> Por princípio, é incapaz de fazer-se responsável, necessitando de ordens sucessivas para realizar algo.'
  ),
  (
    'XX — Hiperatividade / Hipoatividade',
    '### Diretriz Clínica\n\n' ||
    '> A criança pode apresentar desde agitação, excitação desordenada e incontrolada, até grande passividade, com ausência total de resposta. Estes comportamentos não tem nenhuma finalidade.'
  ),
  (
    'XXI — Movimentos estereotipados e repetitivos',
    '### Diretriz Clínica\n\n' ||
    '> Ocorrem em situações de repouso ou atividade, com início repentino.'
  ),
  (
    'XXII — Ignora o perigo',
    '### Diretriz Clínica\n\n' ||
    '> Expõe-se a riscos sem ter consciência do perigo.'
  ),
  (
    'XXIII — Aparecimento dos sintomas antes dos 36 meses (DSM-IV)',
    '### Diretriz Clínica\n\n' ||
    '> Indicadores precoces de TEA. Manifestam-se através de déficits na comunicação verbal/não verbal, presença de estereotipias ou evitação do contato visual, tipicamente notados antes dos 3 anos de idade.'
  )

) AS d(texto_alvo, markdown_conteudo)
-- O LIKE garante o vínculo com a string exata, ignorando as quebras de linha (\n)
-- adicionadas no script original do ATA.
WHERE p.texto_pergunta LIKE d.texto_alvo || '%';
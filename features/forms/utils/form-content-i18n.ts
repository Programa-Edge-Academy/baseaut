import type { Locale } from "@/features/settings/constants/translations";

/**
 * Display-time localization for canonical, seeded form content — form titles,
 * question texts (`texto_pergunta`), question descriptions (`descricao`) and
 * option values (`opcoes.valores`) of the protocol instruments (CARS, ATA, the
 * session Control Record and MABC-2).
 *
 * These strings are stored in the database in Portuguese and are the same for
 * every deployment (they come from the seed migrations), so they are safe to
 * translate for *display* without ever changing the stored value. Anything the
 * user typed themselves (free-text answers, custom titles/descriptions) is not
 * in the dictionary and is returned unchanged, so it stays exactly as written.
 *
 * Lookup is by the exact canonical Portuguese string (normalized only for line
 * endings and surrounding whitespace). A miss falls back to the raw value, so
 * the worst case is an untranslated string rendered in Portuguese rather than a
 * broken one.
 */

/** Normalizes a canonical DB string for dictionary lookup. */
function norm(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

/**
 * Canonical Portuguese → English map for seeded form content. Keys must match
 * the stored value exactly (aside from line-ending/whitespace normalization).
 * Multi-line ATA questions keep the `\n(0=` marker so the title/scoring split
 * in {@link file://../components/form-component.tsx} keeps working. Descriptions
 * keep the literal `\n` escapes present in the seed so the component's
 * `replace(/\\n/g, "\n")` still expands them.
 */
const FORM_CONTENT_EN: Record<string, string> = {
  // ── Form titles ──────────────────────────────────────────────────────────
  "ATA — Escala de Traços Autísticos": "ATA — Autistic Traits Scale",
  "Registro de Controle - PEFaut": "Control Record - PEFaut",
  "MABC-2 Faixa 1 (3 a 6 anos)": "MABC-2 Band 1 (ages 3 to 6)",
  "MABC-2 Faixa 2 (7 a 10 anos)": "MABC-2 Band 2 (ages 7 to 10)",
  "MABC-2 Faixa 3 (11 a 16 anos)": "MABC-2 Band 3 (ages 11 to 16)",

  // ── Form descriptions ────────────────────────────────────────────────────
  "Escala de Cotação do Autismo Infantil. 15 domínios, pontuação 1–4. Aplicadora: PEFaut/UFAL.":
    "Childhood Autism Rating Scale. 15 domains, scored 1–4. Administered by: PEFaut/UFAL.",
  "Ballabriga et al., 1994; adapt. Assumpção et al., 1999. 23 domínios, pontuação 0/1/2. Ponto de corte: 15.":
    "Ballabriga et al., 1994; adapt. Assumpção et al., 1999. 23 domains, scored 0/1/2. Cutoff: 15.",
  "Formulário padrão de registro de controle da sessão (comportamentos, fugas e engajamento).":
    "Standard session control record form (behaviors, escapes and engagement).",

  // ── Control Record (RC) questions ────────────────────────────────────────
  "Tempo da sessão": "Session time",
  "Fugas (número de fugas e tempo do ocorrido)":
    "Escapes (number of escapes and time of occurrence)",
  "Contato visual - Pessoas": "Eye contact - People",
  "Contato visual - Objetos": "Eye contact - Objects",
  "Comportamentos Estereotipados": "Stereotyped Behaviors",
  "Comportamentos Inaptos": "Inappropriate Behaviors",
  "Atividade de engajamento realizada pela 1ª vez (Descreva atividade, tipo de ajuda física e tempo)":
    "Engagement activity performed for the 1st time (Describe the activity, type of physical help and time)",
  "Atividade Preferencial - Manipulativa": "Preferred Activity - Manipulative",
  "Atividade Preferencial - Equilíbrio": "Preferred Activity - Balance",
  "Atividade Preferencial - Força": "Preferred Activity - Strength",

  // ── Shared option values ─────────────────────────────────────────────────
  "Sim": "Yes",
  "Não": "No",
  "Nenhuma das opções": "None of the options",

  // Comportamentos Estereotipados (options)
  "Corridas de um lugar a outro": "Running from place to place",
  "Saltos no mesmo lugar": "Jumping in place",
  "Balanceio": "Rocking",
  "Olha e brinca com as mãos e os dedos": "Looks at and plays with hands and fingers",
  "Pontapés": "Kicking",
  "Faz caretas": "Making faces",
  "Roda objetos ou sobre si mesmo": "Spinning objects or self",
  "Caminha na ponta dos pés ou saltando": "Walking on tiptoes or hopping",
  "Arrasta os pés": "Dragging feet",
  "Torce o corpo": "Twisting the body",

  // Comportamentos Inaptos (options)
  "Cabeçada": "Headbutt",
  "Pegada na roupa": "Grabbing clothes",
  "Chute": "Kick",
  "Tapa": "Slap",
  "Mordida": "Bite",
  "Puxar cabelo": "Hair pulling",
  "Beliscar": "Pinching",

  // ── CARS — domain titles ─────────────────────────────────────────────────
  "I — Relação com pessoas": "I — Relating to people",
  "II — Imitação": "II — Imitation",
  "III — Resposta emocional": "III — Emotional response",
  "IV — Uso corporal": "IV — Body use",
  "V — Uso de objectos": "V — Object use",
  "VI — Adaptação à mudança": "VI — Adaptation to change",
  "VII — Resposta visual": "VII — Visual response",
  "VIII — Resposta auditiva ao som": "VIII — Listening response",
  "IX — Resposta ao paladar, olfacto e tacto": "IX — Taste, smell and touch response",
  "X — Medo ou ansiedade": "X — Fear or anxiety",
  "XI — Comunicação verbal": "XI — Verbal communication",
  "XII — Comunicação não verbal": "XII — Nonverbal communication",
  "XIII — Nível de actividade": "XIII — Activity level",
  "XIV — Nível e consistência da resposta intelectual":
    "XIV — Level and consistency of intellectual response",
  "XV — Impressão global": "XV — General impressions",

  // ── CARS / observations (shared "N — Observações" items) ─────────────────
  "I — Observações": "I — Notes",
  "II — Observações": "II — Notes",
  "III — Observações": "III — Notes",
  "IV — Observações": "IV — Notes",
  "V — Observações": "V — Notes",
  "VI — Observações": "VI — Notes",
  "VII — Observações": "VII — Notes",
  "VIII — Observações": "VIII — Notes",
  "IX — Observações": "IX — Notes",
  "X — Observações": "X — Notes",
  "XI — Observações": "XI — Notes",
  "XII — Observações": "XII — Notes",
  "XIII — Observações": "XIII — Notes",
  "XIV — Observações": "XIV — Notes",
  "XV — Observações": "XV — Notes",

  // ── CARS — scoring guideline descriptions ────────────────────────────────
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Sem evidência de anomalia ou dificuldade na relação com as pessoas.\n* **2.0 (Ligeiramente anormal):** Alguma timidez, agitação ou aborrecimento pode ser observada, mas não superior ao esperado para a idade.\n* **3.0 (Moderadamente anormal):** A criança mostra-se distante ignorando os adultos e parecendo ausente por momentos. Esforços são necessários para prender sua atenção.\n* **4.0 (Severamente anormal):** Distante e desinteressada do que o adulto está a fazer. Quase nunca inicia ou responde ao contacto.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** No evidence of abnormality or difficulty relating to people.\n* **2.0 (Mildly abnormal):** Some shyness, fussiness, or annoyance may be observed, but no more than expected for the child's age.\n* **3.0 (Moderately abnormal):** The child appears aloof, ignoring adults and seeming absent at times. Persistent effort is needed to hold their attention.\n* **4.0 (Severely abnormal):** Consistently aloof and unaware of what the adult is doing. Almost never initiates or responds to contact.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Imitação apropriada de sons, palavras e movimentos.\n* **2.0 (Ligeiramente anormal):** Imita comportamentos simples na maior parte das vezes, ocasionalmente necessita de estímulo ou apresenta atraso.\n* **3.0 (Moderadamente anormal):** Imita só parte do tempo, requerendo grande persistência e ajuda do adulto.\n* **4.0 (Severamente anormal):** Raramente ou nunca imita sons, palavras ou movimentos mesmo com a ajuda do adulto.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Appropriate imitation of sounds, words, and movements.\n* **2.0 (Mildly abnormal):** Imitates simple behaviors most of the time, occasionally needing prompting or showing a delay.\n* **3.0 (Moderately abnormal):** Imitates only part of the time, requiring great persistence and help from the adult.\n* **4.0 (Severely abnormal):** Rarely or never imitates sounds, words, or movements even with the adult's help.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Respostas adequadas à idade e à situação (expressão facial, postura).\n* **2.0 (Ligeiramente anormal):** Ocasionalmente desenvolve reação desajustada. Reações muitas vezes não relacionadas com os acontecimentos.\n* **3.0 (Moderadamente anormal):** Reações muito apagadas ou excessivas. Pode gritar ou rir sem motivo aparente.\n* **4.0 (Severamente anormal):** Raramente a resposta é adequada. Pode manifestar diferentes emoções num curto espaço de tempo, mesmo sem alterações no ambiente.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Responses appropriate to age and situation (facial expression, posture).\n* **2.0 (Mildly abnormal):** Occasionally shows a mismatched reaction. Reactions are often unrelated to events.\n* **3.0 (Moderately abnormal):** Reactions are very muted or excessive. May scream or laugh for no apparent reason.\n* **4.0 (Severely abnormal):** Responses are rarely appropriate. May show different emotions in a short span of time, even with no change in the environment.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Move-se com a facilidade, agilidade e coordenação esperada para a idade.\n* **2.0 (Ligeiramente anormal):** Algumas peculiaridades (desajeitada, movimentos repetitivos leves, coordenação pobre).\n* **3.0 (Moderadamente anormal):** Comportamentos nitidamente estranhos (movimentos finos dos dedos, autoagressão, balanceio, rodopiar, marcha em bicos de pés).\n* **4.0 (Severamente anormal):** Movimentos anormais muito frequentes e intensos. Persistem mesmo quando se tenta inibir ou envolver a criança noutra atividade.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Moves with the ease, agility, and coordination expected for their age.\n* **2.0 (Mildly abnormal):** Some peculiarities (clumsiness, mild repetitive movements, poor coordination).\n* **3.0 (Moderately abnormal):** Clearly odd behaviors (fine finger movements, self-injury, rocking, spinning, walking on tiptoes).\n* **4.0 (Severely abnormal):** Abnormal movements that are very frequent and intense. They persist even when trying to inhibit them or engage the child in another activity.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Interesse e uso apropriados de brinquedos.\n* **2.0 (Ligeiramente anormal):** Menos interesse que o normal ou uso infantil (ex: levar à boca em idade não aceitável).\n* **3.0 (Moderadamente anormal):** Preocupação em utilizá-los de modo estranho (foco em parte insignificante, fascinação por reflexo de luz, mover repetidamente).\n* **4.0 (Severamente anormal):** Comportamento anômalo frequente e intenso. Muito difícil de ser alterado ou desligado da atividade.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Appropriate interest in and use of toys.\n* **2.0 (Mildly abnormal):** Less interest than normal or immature use (e.g., mouthing at an age when that is no longer acceptable).\n* **3.0 (Moderately abnormal):** Preoccupation with using them in an odd way (focus on an insignificant part, fascination with reflected light, repetitive moving).\n* **4.0 (Severely abnormal):** Anomalous behavior that is frequent and intense. Very hard to change or to redirect the child away from the activity.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Pode reagir à mudança de rotina, mas aceita sem stress desajustado.\n* **2.0 (Ligeiramente anormal):** Pode resistir à mudança, mas a atenção é desviada facilmente e acalma-se.\n* **3.0 (Moderadamente anormal):** Resiste ativamente às mudanças de rotina. Fica zangada e infeliz quando a rotina é alterada.\n* **4.0 (Severamente anormal):** Reação intensa e difícil de eliminar. Se a mudança é imposta, fica extremamente zangada e com birras.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** May react to a change in routine but accepts it without undue stress.\n* **2.0 (Mildly abnormal):** May resist change, but attention is easily redirected and the child calms down.\n* **3.0 (Moderately abnormal):** Actively resists changes to routine. Becomes angry and unhappy when the routine is altered.\n* **4.0 (Severely abnormal):** Intense reaction that is hard to defuse. If change is imposed, becomes extremely angry and has tantrums.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Comportamento visual normal. Visão usada em conjunto com outros sentidos.\n* **2.0 (Ligeiramente anormal):** Tem de ser lembrada de olhar. Pode fixar espelhos/luzes, ficar com olhar ausente ou evitar contato visual ocasionalmente.\n* **3.0 (Moderadamente anormal):** Olhar fixo, ausente. Evita contato visual, olha objetos de ângulo estranho ou muito perto dos olhos.\n* **4.0 (Severamente anormal):** Evita constantemente olhar para as pessoas ou certos objetos e mostra formas extremas das peculiaridades acima.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Normal visual behavior. Vision is used together with the other senses.\n* **2.0 (Mildly abnormal):** Has to be reminded to look. May stare at mirrors/lights, have a blank gaze, or occasionally avoid eye contact.\n* **3.0 (Moderately abnormal):** Fixed, blank gaze. Avoids eye contact, looks at objects from an odd angle or very close to the eyes.\n* **4.0 (Severely abnormal):** Constantly avoids looking at people or certain objects and shows extreme forms of the peculiarities above.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Comportamento auditivo normal.\n* **2.0 (Ligeiramente anormal):** Falta de resposta a alguns sons ou ligeiramente exagerada para outros. Resposta atrasada ocasional.\n* **3.0 (Moderadamente anormal):** Ignora o som inicialmente. Pode assustar-se com sons do dia-a-dia e tapar os ouvidos.\n* **4.0 (Severamente anormal):** Hiper ou hiporreação de modo extremo, independentemente do tipo de som.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Normal listening behavior.\n* **2.0 (Mildly abnormal):** Lack of response to some sounds or a slightly exaggerated response to others. Occasional delayed response.\n* **3.0 (Moderately abnormal):** Initially ignores the sound. May be startled by everyday sounds and cover their ears.\n* **4.0 (Severely abnormal):** Extreme over- or under-reaction regardless of the type of sound.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Explora objetos novos de modo apropriado. Reação normal a estímulos de dor (queda, pancada).\n* **2.0 (Ligeiramente anormal):** Persiste em levar à boca/cheirar objetos não comestíveis. Reação levemente excessiva ou ignorada a dores ligeiras.\n* **3.0 (Moderadamente anormal):** Moderadamente preocupada em tocar, cheirar ou saborear objetos/pessoas. Reação anormal à dor.\n* **4.0 (Severamente anormal):** Preocupada em cheirar/saborear/tocar puramente pela sensação física. Ignora dor ou reage de forma extrema.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Explores new objects appropriately. Normal reaction to painful stimuli (a fall, a bump).\n* **2.0 (Mildly abnormal):** Persists in mouthing/smelling inedible objects. Slightly excessive or ignored reaction to mild pain.\n* **3.0 (Moderately abnormal):** Moderately preoccupied with touching, smelling, or tasting objects/people. Abnormal reaction to pain.\n* **4.0 (Severely abnormal):** Preoccupied with smelling/tasting/touching purely for the physical sensation. Ignores pain or reacts in an extreme way.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Comportamento adequado à situação.\n* **2.0 (Ligeiramente anormal):** Ocasionalmente revela medo ou ansiedade ligeiramente desajustada.\n* **3.0 (Moderadamente anormal):** Resposta excessiva ou inferior ao esperado. Difícil de entender o motivo e difícil de confortar.\n* **4.0 (Severamente anormal):** Medos persistem após repetidas experiências sem perigo. Ou, pelo contrário, ausência total de receio em situações perigosas (cães estranhos, trânsito).":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Behavior appropriate to the situation.\n* **2.0 (Mildly abnormal):** Occasionally shows slightly mismatched fear or anxiety.\n* **3.0 (Moderately abnormal):** Response greater or smaller than expected. Hard to understand the reason and hard to comfort.\n* **4.0 (Severely abnormal):** Fears persist after repeated harmless experiences. Or, conversely, a total absence of fear in dangerous situations (strange dogs, traffic).",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Normal em relação à idade.\n* **2.0 (Ligeiramente anormal):** Atraso global. Ecolalias e troca de pronomes ocasionais após a idade esperada. Palavras peculiares/jargão ocasionais.\n* **3.0 (Moderadamente anormal):** Linguagem ausente ou mistura de linguagem com ecolalia/jargão. Repetição sem fins comunicativos (falas de TV). Preocupação com tópicos específicos.\n* **4.0 (Severamente anormal):** Não há linguagem com sentido. Gritos, sons bizarros ou imitação de linguagem sem significado. Uso persistente e bizarro de frases.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Normal for the child's age.\n* **2.0 (Mildly abnormal):** Overall delay. Occasional echolalia and pronoun reversal past the expected age. Occasional peculiar words/jargon.\n* **3.0 (Moderately abnormal):** Absent language or a mix of language with echolalia/jargon. Repetition with no communicative purpose (TV lines). Preoccupation with specific topics.\n* **4.0 (Severely abnormal):** No meaningful language. Screams, bizarre sounds, or imitation of language without meaning. Persistent and bizarre use of phrases.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Adequada à idade.\n* **2.0 (Ligeiramente anormal):** Comunicação não verbal imatura. Aponta vagamente para o que pretende.\n* **3.0 (Moderadamente anormal):** Incapaz de exprimir necessidades de modo não verbal ou entender os outros. Pode levar o adulto pela mão, mas não aponta.\n* **4.0 (Severamente anormal):** Usa somente gestos peculiares e bizarros sem significado. Não compreende expressões faciais ou gestos dos outros.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Appropriate for the child's age.\n* **2.0 (Mildly abnormal):** Immature nonverbal communication. Points vaguely at what they want.\n* **3.0 (Moderately abnormal):** Unable to express needs nonverbally or to understand others. May lead the adult by the hand but does not point.\n* **4.0 (Severely abnormal):** Uses only peculiar, bizarre gestures with no meaning. Does not understand others' facial expressions or gestures.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Atividade compatível com a idade e circunstâncias.\n* **2.0 (Ligeiramente anormal):** Ligeiramente irrequieta ou lenta, mas passível de redirecionamento e encorajamento.\n* **3.0 (Moderadamente anormal):** Muito ativa e difícil de conter (energia ilimitada) OU completamente letárgica e preguiçosa para atividades físicas.\n* **4.0 (Severamente anormal):** Extremos de hiperatividade (necessitando de controle constante) ou inatividade letárgica severa.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Activity consistent with age and circumstances.\n* **2.0 (Mildly abnormal):** Slightly restless or slow, but able to be redirected and encouraged.\n* **3.0 (Moderately abnormal):** Very active and hard to contain (boundless energy) OR completely lethargic and reluctant toward physical activity.\n* **4.0 (Severely abnormal):** Extremes of hyperactivity (requiring constant control) or severe lethargic inactivity.",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Inteligência sobreponível às crianças da mesma idade.\n* **2.0 (Ligeiramente anormal):** Não é tão desperta, capacidades parecem ligeiramente atrasadas em todas as áreas.\n* **3.0 (Moderadamente anormal):** Globalmente não é tão esperta quanto os pares, contudo, em uma ou mais áreas pode funcionar próximo do normal.\n* **4.0 (Severamente anormal):** Pode funcionar muito melhor que as crianças da sua idade em áreas específicas, apresentando talentos invulgares (música, arte, números).":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** Intelligence comparable to children of the same age.\n* **2.0 (Mildly abnormal):** Not as sharp; abilities seem slightly delayed across all areas.\n* **3.0 (Moderately abnormal):** Overall not as bright as peers, yet in one or more areas may function close to normal.\n* **4.0 (Severely abnormal):** May function far better than same-age children in specific areas, showing unusual talents (music, art, numbers).",
  "### Diretrizes de Pontuação\n\n* **1.0 (Normal):** Sem autismo. Não mostra sintomas característicos.\n* **2.0 (Ligeiramente anormal):** Autismo ligeiro. Revela poucos sintomas ou grau leve.\n* **3.0 (Moderadamente anormal):** Autismo moderado. Mostra alguns sintomas ou grau moderado.\n* **4.0 (Severamente anormal):** Autismo severo. Revela muitos sintomas ou grau extremo.":
    "### Scoring Guidelines\n\n* **1.0 (Normal):** No autism. Does not show characteristic symptoms.\n* **2.0 (Mildly abnormal):** Mild autism. Shows few symptoms or a mild degree.\n* **3.0 (Moderately abnormal):** Moderate autism. Shows some symptoms or a moderate degree.\n* **4.0 (Severely abnormal):** Severe autism. Shows many symptoms or an extreme degree.",

  // ── MABC-2 — item labels (Band 1: ages 3–6) ──────────────────────────────
  "DM 1 Colocar Moedas no Cofre (Mão Preferida)": "DM 1 Placing Coins in the Box (Preferred Hand)",
  "DM 1 Colocar Moedas no Cofre (Mão Não Preferida)": "DM 1 Placing Coins in the Box (Non-preferred Hand)",
  "DM 2 Entrelaçar os Cubos com o Cordão": "DM 2 Threading Cubes onto the Lace",
  "DM 3 Desenhar o Caminho 1": "DM 3 Drawing the Trail 1",
  "MP 1 Pegar o Saquinho de Feijão": "MP 1 Catching the Beanbag",
  "MP 2 Arremessar o Saquinho de Feijão no Tapete": "MP 2 Throwing the Beanbag onto the Mat",
  "E 1 Equilibrio em Uma Perna Só (Melhor Perna)": "E 1 One-Leg Balance (Best Leg)",
  "E 1 Equilibrio em Uma Perna Só (Outra Perna)": "E 1 One-Leg Balance (Other Leg)",
  "E 2 Caminhar na Ponta dos Pés": "E 2 Walking on Tiptoes",
  "E 3 Saltar nos Tapetes": "E 3 Jumping on the Mats",

  // ── MABC-2 — item labels (Band 2: ages 7–10) ─────────────────────────────
  "DM 1 Colocar os Pinos no Tabuleiro (Mão Preferida)": "DM 1 Placing Pegs in the Board (Preferred Hand)",
  "DM 1 Colocar os Pinos no Tabuleiro (Mão Não Preferida)": "DM 1 Placing Pegs in the Board (Non-preferred Hand)",
  "DM 2 Entrelaçar o Cordão": "DM 2 Threading the Lace",
  "DM 3 Desenhar o Caminho 2": "DM 3 Drawing the Trail 2",
  "MP 1 Pegar com as Duas Mãos": "MP 1 Catching with Both Hands",
  "E 1 Equilíbrio sobre uma Prancha (Melhor Perna)": "E 1 Balance on a Board (Best Leg)",
  "E 1 Equilíbrio sobre uma Prancha (Outra Perna)": "E 1 Balance on a Board (Other Leg)",
  "E 2 Caminhar para Frente Calcanhar-Dedos": "E 2 Walking Forward Heel-to-Toe",
  "E 3 Saltar com Um Pé nos Tapetes (Melhor Perna)": "E 3 One-Leg Hopping on the Mats (Best Leg)",
  "E 3 Saltar com Um Pé nos Tapetes (Outra Perna)": "E 3 One-Leg Hopping on the Mats (Other Leg)",

  // ── MABC-2 — item labels (Band 3: ages 11–16) ────────────────────────────
  "DM 1 Virar os Pinos (Mão Preferida)": "DM 1 Turning the Pegs (Preferred Hand)",
  "DM 1 Virar os Pinos (Mão Não Preferida)": "DM 1 Turning the Pegs (Non-preferred Hand)",
  "DM 2 Triângulo com Porcas e Parafusos": "DM 2 Triangle with Nuts and Bolts",
  "DM 3 Desenhar o Caminho 3": "DM 3 Drawing the Trail 3",
  "MP 1 Pegar com Uma Mão (Melhor Mão)": "MP 1 Catching with One Hand (Best Hand)",
  "MP 1 Pegar com Uma Mão (Outra Mão)": "MP 1 Catching with One Hand (Other Hand)",
  "MP 2 Arremessar em um Alvo na Parede": "MP 2 Throwing at a Target on the Wall",
  "E 1 Equilíbrio sobre Duas Pranchas": "E 1 Balance on Two Boards",
  "E 2 Caminhar para Trás Dedos-Calcanhar": "E 2 Walking Backward Toe-to-Heel",
  "E 3 Saltar com Um Pé em Zigue-Zague (Melhor Perna)": "E 3 One-Leg Zigzag Hopping (Best Leg)",
  "E 3 Saltar com Um Pé em Zigue-Zague (Outra Perna)": "E 3 One-Leg Zigzag Hopping (Other Leg)",

  // ── ATA — question blocks (title + scale + indicators), items I–XII ───────
  "I — Dificuldade na interação social\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não sorri; ausência de aproximações espontâneas; não busca companhia; busca esconderijo; evita pessoas; incapaz de manter intercâmbio social; isolamento intenso.":
    "I — Difficulty with social interaction\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not smile; no spontaneous approaches; does not seek company; seeks to hide; avoids people; unable to sustain social exchange; intense isolation.",
  "II — Manipulação do ambiente\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não responde às solicitações; mudança repentina de humor; indiferente sem expressão; risos compulsivos; birra e raiva passageira; excitação motora ou verbal.":
    "II — Manipulation of the environment\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not respond to requests; sudden mood change; indifferent and expressionless; compulsive laughter; passing tantrums and anger; motor or verbal excitement.",
  "III — Utilização das pessoas a seu redor\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: usa o adulto como objeto; adulto como apoio; adulto como meio para suprir necessidade; interfere na conduta do adulto quando não atendido.":
    "III — Using the people around them\n(0=none | 1=one symptom | 2=more than one)\nIndicators: uses the adult as an object; the adult as support; the adult as a means to meet a need; interferes with the adult's behavior when not attended to.",
  "IV — Resistência a mudanças\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: insistente em manter a rotina; grande dificuldade em aceitar mudanças de lugar, vestuário ou alimentação; persiste na mesma resposta ou atividade.":
    "IV — Resistance to change\n(0=none | 1=one symptom | 2=more than one)\nIndicators: insists on keeping the routine; great difficulty accepting changes of place, clothing, or food; persists in the same response or activity.",
  "V — Busca de uma ordem rígida\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: ordena objetos por critérios próprios; prende-se a ordenação espacial; prende-se a sequência temporal; correspondência pessoa-lugar rígida.":
    "V — Seeking a rigid order\n(0=none | 1=one symptom | 2=more than one)\nIndicators: arranges objects by their own criteria; fixates on spatial ordering; fixates on a temporal sequence; rigid person-place matching.",
  "VI — Falta de contato visual / olhar indefinido\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: desvia olhares diretos; vira a cabeça quando chamado; olhar vazio e sem vida; segue estímulos de forma intermitente; fixa objetos com olhar periférico; dá sensação de não olhar.":
    "VI — Lack of eye contact / vacant gaze\n(0=none | 1=one symptom | 2=more than one)\nIndicators: avoids direct gaze; turns the head away when called; empty, lifeless gaze; follows stimuli intermittently; fixates objects with peripheral vision; gives the impression of not looking.",
  "VII — Mímica inexpressiva\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não usa expressão facial ou gestual ao falar; sem reação antecipatória; não expressa pela mímica o que quer ou sente; imobilidade facial.":
    "VII — Expressionless mimicry\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not use facial or gestural expression when speaking; no anticipatory reaction; does not express through mimicry what they want or feel; facial immobility.",
  "VIII — Distúrbios de sono\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não quer ir dormir; levanta-se muito cedo; sono irregular; troca o dia pela noite; dorme poucas horas.":
    "VIII — Sleep disturbances\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not want to go to sleep; wakes up very early; irregular sleep; swaps day for night; sleeps few hours.",
  "IX — Alteração na alimentação\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: seletividade alimentar rígida; come objetos não alimentares; não mastigava quando pequeno; atividade ruminante; vômitos; come grosseiramente; rituais alimentares; ausência de paladar.":
    "IX — Eating disturbance\n(0=none | 1=one symptom | 2=more than one)\nIndicators: rigid food selectivity; eats non-food objects; did not chew when little; rumination; vomiting; eats coarsely; eating rituals; absence of taste.",
  "X — Dificuldade no controle dos esfíncteres\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: medo de sentar no vaso; usa esfíncteres para manipular o adulto; usa como estimulação corporal; controle diurno presente mas noturno tardio ou ausente.":
    "X — Difficulty with sphincter control\n(0=none | 1=one symptom | 2=more than one)\nIndicators: fear of sitting on the toilet; uses the sphincters to manipulate the adult; uses it as bodily stimulation; daytime control present but nighttime control late or absent.",
  "XI — Exploração dos objetos (apalpar, chupar)\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: morde e engole objetos não alimentares; chupa e coloca coisas na boca; cheira tudo; apalpa superfícies minuciosamente.":
    "XI — Exploration of objects (feeling, sucking)\n(0=none | 1=one symptom | 2=more than one)\nIndicators: bites and swallows non-food objects; sucks and puts things in the mouth; smells everything; feels surfaces meticulously.",
  "XII — Uso inapropriado dos objetos\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: ignora objetos ou interesse momentâneo; golpeia ou atira; conduta atípica; carrega obsessivamente certo objeto; interesse em parte do objeto; coleciona objetos estranhos; usa objetos de forma inadequada.":
    "XII — Inappropriate use of objects\n(0=none | 1=one symptom | 2=more than one)\nIndicators: ignores objects or shows momentary interest; strikes or throws them; atypical behavior; obsessively carries a certain object; interest in a part of the object; collects strange objects; uses objects inappropriately.",

  // ── ATA — question blocks (title + scale + indicators), items XIII–XXIII ──
  "XIII — Falta de atenção\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: atenção por curto espaço de tempo; age como surdo; tempo de latência aumentado; resposta retardada; sensação de ausência frequente.":
    "XIII — Lack of attention\n(0=none | 1=one symptom | 2=more than one)\nIndicators: attention for a short span of time; acts as if deaf; increased latency; delayed response; frequent sense of absence.",
  "XIV — Ausência de interesse pela aprendizagem\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não quer aprender; cansa-se rapidamente; esquece rápido; insiste em ser ajudado mesmo sabendo; insiste constantemente em mudar de atividade.":
    "XIV — Absence of interest in learning\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not want to learn; tires quickly; forgets quickly; insists on being helped even when able; constantly insists on changing activity.",
  "XV — Falta de iniciativa\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: incapaz de ter iniciativa própria; busca comodidade; passividade e falta de interesse; lentidão; prefere que outro faça o trabalho.":
    "XV — Lack of initiative\n(0=none | 1=one symptom | 2=more than one)\nIndicators: unable to take their own initiative; seeks comfort; passivity and lack of interest; slowness; prefers that someone else do the work.",
  "XVI — Alteração de linguagem e comunicação\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: mutismo; estereotipias vocais; entonação incorreta; ecolalia imediata e/ou retardada; repetição de palavras ou frases; sons estereotipados sem razão aparente; não se comunica por gestos; interações sem diálogo.":
    "XVI — Language and communication disturbance\n(0=none | 1=one symptom | 2=more than one)\nIndicators: mutism; vocal stereotypies; incorrect intonation; immediate and/or delayed echolalia; repetition of words or phrases; stereotyped sounds for no apparent reason; does not communicate by gestures; interactions without dialogue.",
  "XVII — Não manifesta habilidades e conhecimentos\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não realiza se não quiser; não demonstra o que sabe sem necessidade específica; demonstra habilidades somente em lugares/pessoas determinados; surpreende por habilidades inesperadas.":
    "XVII — Does not display skills and knowledge\n(0=none | 1=one symptom | 2=more than one)\nIndicators: does not perform unless they want to; does not show what they know without a specific need; shows skills only in certain places/with certain people; surprises with unexpected abilities.",
  "XVIII — Reações inapropriadas ante a frustração\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: desagrado se algo é esquecido; desagrado se atividade é interrompida; desgosto quando desejos não se cumprem; reações de birra.":
    "XVIII — Inappropriate reactions to frustration\n(0=none | 1=one symptom | 2=more than one)\nIndicators: displeasure if something is forgotten; displeasure if an activity is interrupted; distress when wishes are not fulfilled; tantrum reactions.",
  "XIX — Não assume responsabilidades\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não assume nenhuma responsabilidade por menor que seja; necessita que se repita muitas vezes ou eleve o tom de voz para realizar algo.":
    "XIX — Does not take on responsibilities\n(0=none | 1=one symptom | 2=more than one)\nIndicators: takes on no responsibility, however small; needs it to be repeated many times or the voice raised to do something.",
  "XX — Hiperatividade / Hipoatividade\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: constantemente em movimento; mesmo estimulado não se move; barulhento; vai de um lugar a outro sem parar; fica pulando no mesmo lugar; não sai do lugar.":
    "XX — Hyperactivity / Hypoactivity\n(0=none | 1=one symptom | 2=more than one)\nIndicators: constantly in motion; does not move even when stimulated; noisy; goes from place to place without stopping; keeps jumping in the same spot; does not leave the spot.",
  "XXI — Movimentos estereotipados e repetitivos\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: balanceia-se; olha e brinca com mãos/dedos; tapa olhos e orelhas; dá pontapés; faz caretas e movimentos estranhos com a face; roda objetos ou sobre si mesmo; caminha na ponta dos pés ou com movimentos estranhos; torce o corpo ou mantém postura desequilibrada.":
    "XXI — Stereotyped and repetitive movements\n(0=none | 1=one symptom | 2=more than one)\nIndicators: rocks; looks at and plays with hands/fingers; covers eyes and ears; kicks; makes faces and strange movements with the face; spins objects or self; walks on tiptoes or with strange movements; twists the body or holds an unbalanced posture.",
  "XXII — Ignora o perigo\n(0=nenhum | 1=um sintoma | 2=mais de um)\nIndicadores: não se dá conta do perigo; sobe em todos os lugares; parece insensível à dor.":
    "XXII — Ignores danger\n(0=none | 1=one symptom | 2=more than one)\nIndicators: unaware of danger; climbs everywhere; seems insensitive to pain.",
  "XXIII — Aparecimento dos sintomas antes dos 36 meses (DSM-IV)\n(0=não | 1=sim para um domínio | 2=sim para mais de um domínio)\nIndicadores: alterações de linguagem, estereotipias e/ou contato visual manifestas antes dos 3 anos.":
    "XXIII — Onset of symptoms before 36 months (DSM-IV)\n(0=no | 1=yes for one domain | 2=yes for more than one domain)\nIndicators: language disturbances, stereotypies, and/or eye contact manifesting before age 3.",

  // ── ATA — clinical guideline descriptions (items I–XII) ───────────────────
  "### Diretriz Clínica\n\n> O desvio da sociabilidade pode oscilar entre formas leves como, por exemplo, um certo negativismo e a evitação do contato ocular, até formas mais graves, como um intenso isolamento.":
    "### Clinical Guideline\n\n> The deviation in sociability can range from mild forms — such as a certain negativism and avoidance of eye contact — to more severe forms, such as intense isolation.",
  "### Diretriz Clínica\n\n> O problema da manipulação do ambiente pode apresentar-se em nível mais ou menos grave, como não responder às solicitações e manter-se indiferente. O fato mais comum é a manifestação brusca de crises de birra passageira, risos incontroláveis e sem motivo, tudo isto com o fim de conseguir ser o centro da atenção.":
    "### Clinical Guideline\n\n> The problem of manipulating the environment can appear at a more or less severe level, such as not responding to requests and remaining indifferent. The most common feature is the abrupt onset of passing tantrums and uncontrollable, unmotivated laughter, all aimed at becoming the center of attention.",
  "### Diretriz Clínica\n\n> A relação que mantém com o adulto quase nunca é interativa, dado que normalmente se utiliza do adulto como o meio para conseguir o que deseja.":
    "### Clinical Guideline\n\n> The relationship they maintain with the adult is almost never interactive, since they normally use the adult as the means to get what they want.",
  "### Diretriz Clínica\n\n> A resistência a mudanças pode variar da irritabilidade até franca recusa.":
    "### Clinical Guideline\n\n> Resistance to change can range from irritability to outright refusal.",
  "### Diretriz Clínica\n\n> Manifesta tendência a ordenar tudo, podendo chegar a uma conduta de ordem obsessiva, sem a qual não consegue desenvolver nenhuma atividade.":
    "### Clinical Guideline\n\n> Shows a tendency to order everything, which can reach an obsessive ordering behavior, without which they cannot carry out any activity.",
  "### Diretriz Clínica\n\n> A falta de contato pode variar desde um olhar estranho até constante evitação dos estímulos visuais.":
    "### Clinical Guideline\n\n> The lack of contact can range from an odd gaze to constant avoidance of visual stimuli.",
  "### Diretriz Clínica\n\n> A inexpressividade mímica revela a carência da comunicação não verbal. Pode apresentar, desde uma certa expressividade, até uma ausência total de resposta.":
    "### Clinical Guideline\n\n> Expressionless mimicry reveals a lack of nonverbal communication. It can range from a certain expressiveness to a total absence of response.",
  "### Diretriz Clínica\n\n> Quando pequeno dorme muitas horas e, quando maior, dorme poucas horas, se comparado ao padrão esperado para a idade. Esta conduta pode ser constante, ou não.":
    "### Clinical Guideline\n\n> When little they sleep many hours and, when older, few hours, compared with the pattern expected for their age. This behavior may or may not be constant.",
  "### Diretriz Clínica\n\n> Pode ser quantitativa e/ou qualitativa. Pode incluir situações, desde aquela em que a criança deixa de se alimentar, até aquela em que se opõe ativamente.":
    "### Clinical Guideline\n\n> It can be quantitative and/or qualitative. It can include situations ranging from the child ceasing to eat to actively opposing it.",
  "### Diretriz Clínica\n\n> O controle dos esfíncteres pode existir, porém a sua utilização pode ser uma forma de manipular ou chamar a atenção do adulto.":
    "### Clinical Guideline\n\n> Sphincter control may exist, but its use can be a way of manipulating or getting the adult's attention.",
  "### Diretriz Clínica\n\n> Analisa os objetos sensorialmente, requisitando mais os outros órgãos dos sentidos em detrimento da visão, porém sem uma finalidade específica.":
    "### Clinical Guideline\n\n> Analyzes objects sensorially, relying more on the other sense organs at the expense of vision, but without a specific purpose.",
  "### Diretriz Clínica\n\n> Não utiliza os objetos de modo funcional, mas sim de uma forma bizarra.":
    "### Clinical Guideline\n\n> Does not use objects in a functional way, but rather in a bizarre one.",

  // ── ATA — clinical guideline descriptions (items XIII–XXIII) ──────────────
  "### Diretriz Clínica\n\n> Dificuldades na atenção e concentração. Às vezes, fixa a atenção em suas próprias produções sonoras ou motoras, dando a sensação de que se encontra ausente.":
    "### Clinical Guideline\n\n> Difficulties with attention and concentration. At times they fixate on their own sound or motor productions, giving the impression of being absent.",
  "### Diretriz Clínica\n\n> Não tem nenhum interesse por aprender, buscando solução nos demais. Aprender representa um esforço de atenção e de intercâmbio pessoal, é uma ruptura em sua rotina.":
    "### Clinical Guideline\n\n> Has no interest in learning, seeking solutions from others. Learning represents an effort of attention and personal exchange; it is a disruption of their routine.",
  "### Diretriz Clínica\n\n> Busca constantemente a comodidade e espera que lhe dêem tudo pronto. Não realiza nenhuma atividade funcional por iniciativa própria.":
    "### Clinical Guideline\n\n> Constantly seeks comfort and expects everything to be given ready-made. Performs no functional activity on their own initiative.",
  "### Diretriz Clínica\n\n> É uma característica fundamental do autismo, que pode variar desde um atraso de linguagem até formas mais graves, com uso exclusivo de fala particular e estranha.":
    "### Clinical Guideline\n\n> It is a fundamental feature of autism, which can range from a language delay to more severe forms, with exclusive use of private, strange speech.",
  "### Diretriz Clínica\n\n> Nunca manifesta tudo aquilo que é capaz de fazer ou agir, no que diz respeito a seus conhecimentos e habilidades, dificultando a avaliação dos profissionais.":
    "### Clinical Guideline\n\n> Never displays everything they are capable of doing or performing, with respect to their knowledge and skills, making assessment by professionals difficult.",
  "### Diretriz Clínica\n\n> Manifesta desde o aborrecimento à reação de cólera, ante a frustração.":
    "### Clinical Guideline\n\n> Shows, in the face of frustration, anything from annoyance to a reaction of rage.",
  "### Diretriz Clínica\n\n> Por princípio, é incapaz de fazer-se responsável, necessitando de ordens sucessivas para realizar algo.":
    "### Clinical Guideline\n\n> As a rule, they are unable to take responsibility, needing successive orders to do something.",
  "### Diretriz Clínica\n\n> A criança pode apresentar desde agitação, excitação desordenada e incontrolada, até grande passividade, com ausência total de resposta. Estes comportamentos não tem nenhuma finalidade.":
    "### Clinical Guideline\n\n> The child may show anything from agitation and disordered, uncontrolled excitement to great passivity, with a total absence of response. These behaviors serve no purpose.",
  "### Diretriz Clínica\n\n> Ocorrem em situações de repouso ou atividade, com início repentino.":
    "### Clinical Guideline\n\n> They occur in situations of rest or activity, with a sudden onset.",
  "### Diretriz Clínica\n\n> Expõe-se a riscos sem ter consciência do perigo.":
    "### Clinical Guideline\n\n> Exposes themselves to risks without being aware of the danger.",
  "### Diretriz Clínica\n\n> Indicadores precoces de TEA. Manifestam-se através de déficits na comunicação verbal/não verbal, presença de estereotipias ou evitação do contato visual, tipicamente notados antes dos 3 anos de idade.":
    "### Clinical Guideline\n\n> Early indicators of ASD. They manifest through deficits in verbal/nonverbal communication, the presence of stereotypies, or avoidance of eye contact, typically noticed before 3 years of age.",
};

/**
 * Translates a canonical seeded form string for display in the active locale,
 * leaving the stored value untouched. Returns the raw value unchanged for `pt`,
 * for user-authored strings not in the dictionary, and for empty input.
 */
export function localizeFormText(
  value: string | null | undefined,
  locale: Locale,
): string {
  if (!value) return value ?? "";
  if (locale !== "en") return value;
  return FORM_CONTENT_EN[norm(value)] ?? value;
}

/**
 * MABC-2 motor component identifiers (as stored in `opcoes.componente` /
 * section ids) → localized display names, with alias normalization so both the
 * fill path (`pontaria`) and the record RPC (`mirar_pegar`) resolve to the same
 * label.
 */
const MABC_COMPONENT_LABELS: Record<"pt" | "en", Record<string, string>> = {
  pt: {
    destreza_manual: "Destreza manual",
    equilibrio: "Equilíbrio",
    pontaria: "Pontaria e agarrar",
    mirar_pegar: "Pontaria e agarrar",
  },
  en: {
    destreza_manual: "Manual Dexterity",
    equilibrio: "Balance",
    pontaria: "Aiming and Catching",
    mirar_pegar: "Aiming and Catching",
  },
};

/**
 * Canonical alias → normalized component key. Accepts both the stored
 * identifiers (`mirar_pegar`) and the Portuguese display labels
 * (`Pontaria e agarrar`) so the localizer works whether it is handed a raw id
 * or an already-labelled section title.
 */
const MABC_COMPONENT_ALIASES: Record<string, string> = {
  destreza: "destreza_manual",
  destreza_manual: "destreza_manual",
  "destreza manual": "destreza_manual",
  equilibrio: "equilibrio",
  "equilíbrio": "equilibrio",
  pontaria: "pontaria",
  "pontaria e agarrar": "pontaria",
  mirar_pegar: "pontaria",
  pegar_lancar: "pontaria",
  agarrar: "pontaria",
};

/**
 * Localizes a MABC-2 motor component identifier for display. Unknown values
 * (already-localized labels or custom text) are returned unchanged.
 */
export function localizeMabcComponent(value: string | null | undefined, locale: Locale): string {
  if (!value) return value ?? "";
  const key = MABC_COMPONENT_ALIASES[value.toLowerCase()] ?? value;
  return MABC_COMPONENT_LABELS[locale === "en" ? "en" : "pt"][key] ?? value;
}

/** MABC-2 measurement units (stored in `opcoes.unidade`) → English display. */
const MABC_UNIT_EN: Record<string, string> = {
  seg: "sec",
  segundos: "seconds",
  tentativas: "attempts",
  tentativa: "attempt",
  passos: "steps",
  passo: "step",
};

/** Localizes a MABC-2 unit for display, keeping the stored value unchanged. */
export function localizeMabcUnit(unit: string | null | undefined, locale: Locale): string {
  if (!unit) return unit ?? "";
  if (locale !== "en") return unit;
  return MABC_UNIT_EN[unit.toLowerCase()] ?? unit;
}

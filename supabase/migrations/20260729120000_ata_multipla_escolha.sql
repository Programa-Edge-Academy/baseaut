-- =======================================================================
-- Migration: ATA passa a ser preenchido por múltipla escolha
-- =======================================================================
-- Antes: cada um dos 23 domínios era uma escala inteira e o avaliador
-- digitava direto 0, 1 ou 2 em respostas_formulario.valor_preenchido.
--
-- Agora: cada domínio lista os indicadores do instrumento (ESCALA DE
-- TRAÇOS AUTÍSTICOS — Ballabriga et al., 1994; adapt. Assumpção et al.,
-- 1999) como opções de múltipla escolha. O avaliador marca os indicadores
-- observados e a pontuação 0/1/2 passa a ser derivada automaticamente da
-- quantidade marcada, conforme a regra do próprio instrumento:
--   nenhuma opção marcada -> 0
--   uma opção marcada     -> 1
--   duas ou mais          -> 2
--
-- Cada domínio também ganha uma pergunta de "Observações" opcional, como
-- já existia no CARS.
--
-- Os ids das perguntas existentes são preservados (UPDATE, não recriação),
-- para que as respostas já registradas continuem apontando para elas.

-- ----------------------------------------------------------------------
-- 1. Onde guardar as opções marcadas
-- ----------------------------------------------------------------------
ALTER TABLE public.respostas_formulario
  ADD COLUMN IF NOT EXISTS valores_selecionados JSONB;

COMMENT ON COLUMN public.respostas_formulario.valores_selecionados IS
  'Opções marcadas numa pergunta de múltipla escolha. Pode ser vazio ou conter todas as opções da pergunta.';

-- ----------------------------------------------------------------------
-- 2. Converte os 23 domínios para múltipla escolha
-- ----------------------------------------------------------------------
-- O texto da pergunta passa a ser só o título do domínio: a régua "(0=...)"
-- deixa de fazer sentido (a pontuação é derivada) e os indicadores, que
-- antes viviam no enunciado, viram as opções.
DO $$
DECLARE
  v_form_id CONSTANT UUID := '00000000-0000-4a7a-0000-000000000a7a';
  v_dominio RECORD;
  v_ordem   INTEGER;
  v_obs_id  UUID;
BEGIN
  FOR v_dominio IN
    SELECT * FROM (VALUES
      (1,  'I — Dificuldade na interação social', jsonb_build_array(
        'Não sorri',
        'Ausência de aproximações espontâneas',
        'Não busca companhia',
        'Busca constantemente seu cantinho (esconderijo)',
        'Evita pessoas',
        'É incapaz de manter um intercâmbio social',
        'Isolamento intenso')),
      (2,  'II — Manipulação do ambiente', jsonb_build_array(
        'Não responde às solicitações',
        'Mudança repentina de humor',
        'Mantém-se indiferente, sem expressão',
        'Risos compulsivos',
        'Birra e raiva passageira',
        'Excitação motora ou verbal (ir de um lugar a outro, falar sem parar)')),
      (3,  'III — Utilização das pessoas a seu redor', jsonb_build_array(
        'Utiliza-se do adulto como um objeto, levando-o até aquilo que deseja',
        'O adulto lhe serve como apoio para conseguir o que deseja',
        'O adulto é o meio para suprir uma necessidade que não é capaz de realizar só',
        'Se o adulto não responde às suas demandas, atua interferindo na conduta desse adulto')),
      (4,  'IV — Resistência a mudanças', jsonb_build_array(
        'Insistente em manter a rotina',
        'Grande dificuldade em aceitar fatos que alteram sua rotina, tais como mudanças de lugar, de vestuário e na alimentação',
        'Apresenta resistência a mudanças, persistindo na mesma resposta ou atividade')),
      (5,  'V — Busca de uma ordem rígida', jsonb_build_array(
        'Ordenação dos objetos de acordo com critérios próprios e pré-estabelecidos',
        'Prende-se a uma ordenação espacial (cada coisa sempre em seu lugar)',
        'Prende-se a uma sequência temporal (cada coisa em seu tempo)',
        'Prende-se a uma correspondência pessoa-lugar (cada pessoa sempre no lugar determinado)')),
      (6,  'VI — Falta de contato visual. Olhar indefinido', jsonb_build_array(
        'Desvia os olhares diretos, não olhando nos olhos',
        'Volta a cabeça ou o olhar quando é chamado (olhar para fora)',
        'Expressão do olhar vazio e sem vida',
        'Quando segue os estímulos com os olhos, somente o faz de maneira intermitente',
        'Fixa os objetos com um olhar periférico, não central',
        'Dá a sensação de que não olha')),
      (7,  'VII — Mímica inexpressiva', jsonb_build_array(
        'Se fala, não utiliza a expressão facial, gestual ou vocal com a frequência esperada',
        'Não mostra uma reação antecipatória',
        'Não expressa através da mímica ou olhar aquilo que quer ou o que sente',
        'Imobilidade facial')),
      (8,  'VIII — Distúrbios de sono', jsonb_build_array(
        'Não quer ir dormir',
        'Levanta-se muito cedo',
        'Sono irregular (em intervalos)',
        'Troca o dia pela noite',
        'Dorme poucas horas')),
      (9,  'IX — Alteração na alimentação', jsonb_build_array(
        'Seletividade alimentar rígida (ex.: come o mesmo tipo de alimento sempre)',
        'Come outras coisas além de alimentos (papel, insetos)',
        'Quando pequeno não mastigava',
        'Apresenta uma atividade ruminante',
        'Vômitos',
        'Come grosseiramente, esparrama a comida ou a atira',
        'Rituais (esfarela alimentos antes da ingestão)',
        'Ausência de paladar (falta de sensibilidade gustativa)')),
      (10, 'X — Dificuldade no controle dos esfíncteres', jsonb_build_array(
        'Medo de sentar-se no vaso sanitário',
        'Utiliza os esfíncteres para manipular o adulto',
        'Utiliza os esfíncteres como estimulação corporal, para obtenção de prazer',
        'Tem controle diurno, porém o noturno é tardio ou ausente')),
      (11, 'XI — Exploração dos objetos (apalpar, chupar)', jsonb_build_array(
        'Morde e engole objetos não alimentares',
        'Chupa e coloca as coisas na boca',
        'Cheira tudo',
        'Apalpa tudo. Examina as superfícies com os dedos de uma maneira minuciosa')),
      (12, 'XII — Uso inapropriado dos objetos', jsonb_build_array(
        'Ignora os objetos ou mostra um interesse momentâneo',
        'Pega, golpeia ou simplesmente os atira no chão',
        'Conduta atípica com os objetos (segura indiferentemente nas mãos ou gira)',
        'Carrega insistentemente consigo determinado objeto',
        'Se interessa somente por uma parte do objeto ou do brinquedo',
        'Coleciona objetos estranhos',
        'Utiliza os objetos de forma particular e inadequada')),
      (13, 'XIII — Falta de atenção', jsonb_build_array(
        'Quando realiza uma atividade, fixa a atenção por curto espaço de tempo ou é incapaz de fixá-la',
        'Age como se fosse surdo',
        'Tempo de latência de resposta aumentado. Entende as instruções com dificuldade',
        'Resposta retardada',
        'Muitas vezes dá a sensação de ausência')),
      (14, 'XIV — Ausência de interesse pela aprendizagem', jsonb_build_array(
        'Não quer aprender',
        'Cansa-se muito depressa, ainda que de atividade que goste',
        'Esquece rapidamente',
        'Insiste em ser ajudado, ainda que saiba fazer',
        'Insiste constantemente em mudar de atividade')),
      (15, 'XV — Falta de iniciativa', jsonb_build_array(
        'É incapaz de ter iniciativa própria',
        'Busca a comodidade',
        'Passividade, falta de interesse',
        'Lentidão',
        'Prefere que outro faça o trabalho para ele')),
      (16, 'XVI — Alteração de linguagem e comunicação', jsonb_build_array(
        'Mutismo',
        'Estereotipias vocais',
        'Entonação incorreta',
        'Ecolalia imediata e/ou retardada',
        'Repetição de palavras ou frases que podem (ou não) ter valor comunicativo',
        'Emite sons estereotipados quando está agitado e em outras ocasiões, sem nenhuma razão aparente',
        'Não se comunica por gestos',
        'As interações com adulto não são nunca um diálogo')),
      (17, 'XVII — Não manifesta habilidades e conhecimentos', jsonb_build_array(
        'Ainda que saiba fazer uma coisa, não a realiza, se não quiser',
        'Não demonstra o que sabe, até ter uma necessidade primária ou um interesse eminentemente específico',
        'Aprende coisas, porém somente a demonstra em determinados lugares e com determinadas pessoas',
        'Às vezes, surpreende por suas habilidades inesperadas')),
      (18, 'XVIII — Reações inapropriadas ante a frustração', jsonb_build_array(
        'Reações de desagrado caso seja esquecida alguma coisa',
        'Reações de desagrado caso seja interrompida alguma atividade que goste',
        'Desgostoso quando os desejos e as expectativas não se cumprem',
        'Reações de birra')),
      (19, 'XIX — Não assume responsabilidades', jsonb_build_array(
        'Não assume nenhuma responsabilidade, por menor que seja',
        'Para chegar a fazer alguma coisa, há que se repetir muitas vezes ou elevar o tom de voz')),
      (20, 'XX — Hiperatividade / Hipoatividade', jsonb_build_array(
        'A criança está constantemente em movimento',
        'Mesmo estimulada, não se move',
        'Barulhento. Dá a sensação de que é obrigado a fazer ruído/barulho',
        'Vai de um lugar a outro, sem parar',
        'Fica pulando (saltando) no mesmo lugar',
        'Não se move nunca do lugar onde está sentado')),
      (21, 'XXI — Movimentos estereotipados e repetitivos', jsonb_build_array(
        'Balanceia-se',
        'Olha e brinca com as mãos e os dedos',
        'Tapa os olhos e as orelhas',
        'Dá pontapés',
        'Faz caretas e movimentos estranhos com a face',
        'Roda objetos ou sobre si mesmo',
        'Caminha na ponta dos pés ou saltando, arrasta os pés, anda fazendo movimentos estranhos',
        'Torce o corpo, mantém uma postura desequilibrada, pernas dobradas, cabeça recolhida aos pés, extensões violentas do corpo')),
      (22, 'XXII — Ignora o perigo', jsonb_build_array(
        'Não se dá conta do perigo',
        'Sobe em todos os lugares',
        'Parece insensível à dor')),
      (23, 'XXIII — Aparecimento dos sintomas antes dos 36 meses (DSM-IV)', jsonb_build_array(
        'Linguagem',
        'Estereotipias',
        'Contato visual'))
    ) AS d(numero, titulo, opcoes)
  LOOP
    -- Domínio: vira múltipla escolha. A pergunta ocupa a ordem ímpar e a
    -- observação correspondente a par logo em seguida, como no CARS.
    v_ordem := (v_dominio.numero - 1) * 2 + 1;

    UPDATE public.perguntas
    SET
      texto_pergunta = v_dominio.titulo,
      tipo_resposta  = 'multipla_escolha',
      opcoes         = jsonb_build_object('valores', v_dominio.opcoes),
      obrigatoria    = false,
      ordem          = v_ordem
    WHERE formulario_id = v_form_id
      AND ordem = v_dominio.numero
      AND tipo_resposta = 'escala_inteira';

    -- Observações do domínio, criada só se ainda não existir.
    SELECT id INTO v_obs_id
    FROM public.perguntas
    WHERE formulario_id = v_form_id
      AND texto_pergunta = split_part(v_dominio.titulo, ' — ', 1) || ' — Observações';

    IF v_obs_id IS NULL THEN
      INSERT INTO public.perguntas
        (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida, descricao)
      VALUES
        (v_form_id,
         split_part(v_dominio.titulo, ' — ', 1) || ' — Observações',
         'texto_opcional',
         NULL,
         false,
         v_ordem + 1,
         true,
         NULL);
    ELSE
      UPDATE public.perguntas SET ordem = v_ordem + 1 WHERE id = v_obs_id;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------
-- 3. Derivação automática de valor_preenchido (0/1/2)
-- ----------------------------------------------------------------------
-- Vale apenas para perguntas do ATA: nos demais formulários o
-- valor_preenchido continua sendo o que o app enviar.
--
-- Respostas antigas guardam só a pontuação e não têm como saber quais
-- indicadores foram observados. Elas ficam com valores_selecionados NULL,
-- e a função sai sem tocar em nada nesse caso — a pontuação histórica é
-- preservada até que alguém de fato marque os indicadores.
CREATE OR REPLACE FUNCTION public.derivar_pontuacao_ata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo     TEXT;
  v_marcadas INTEGER;
BEGIN
  IF NEW.valores_selecionados IS NULL
     OR jsonb_typeof(NEW.valores_selecionados) <> 'array' THEN
    RETURN NEW;
  END IF;

  SELECT f.tipo INTO v_tipo
  FROM public.perguntas p
  JOIN public.formularios f ON f.id = p.formulario_id
  WHERE p.id = NEW.pergunta_id;

  IF v_tipo IS DISTINCT FROM 'ata' THEN
    RETURN NEW;
  END IF;

  v_marcadas := jsonb_array_length(NEW.valores_selecionados);
  NEW.valor_preenchido := LEAST(v_marcadas, 2)::text;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.derivar_pontuacao_ata() IS
  'Deriva a pontuação 0/1/2 de uma resposta do ATA a partir de quantas opções foram marcadas.';

DROP TRIGGER IF EXISTS trg_derivar_pontuacao_ata ON public.respostas_formulario;
CREATE TRIGGER trg_derivar_pontuacao_ata
  BEFORE INSERT OR UPDATE ON public.respostas_formulario
  FOR EACH ROW
  EXECUTE FUNCTION public.derivar_pontuacao_ata();

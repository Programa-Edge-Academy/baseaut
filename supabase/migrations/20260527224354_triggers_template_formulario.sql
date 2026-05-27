-- ════════════════════════════════════════════════════════════════════
-- TRG-01 — Auto-criação de ATA e CARS para Novos Alunos
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: ao cadastrar um novo aluno, copiar os templates globais de
-- ATA e CARS (formularios onde tipo IN ('ata','cars') E aluno_id IS NULL)
-- para novas instâncias de formulário vinculadas ao aluno, já com
-- protegido = true e com todas as perguntas do template copiadas.
--
-- Critérios atendidos:
--   ✓ AFTER INSERT na tabela alunos
--   ✓ SECURITY DEFINER (acesso às tabelas filhas sem depender do chamador)
--   ✓ Busca templates por tipo IN ('ata','cars') AND aluno_id IS NULL
--   ✓ Cria instância na tabela formularios vinculando id e equipe_id do aluno
--   ✓ protegido = true em todo formulário criado
--   ✓ Copia todas as perguntas do template para a nova instância
--   ✓ Sem lógica de validação ou bloqueio — só criação/cópia
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_aluno_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template   RECORD;
  v_novo_form  UUID;
  v_pergunta   RECORD;
BEGIN
  -- Itera sobre todos os templates globais de ATA e CARS
  FOR v_template IN
    SELECT id, titulo, descricao, tipo, ativo
    FROM public.formularios
    WHERE tipo IN ('ata', 'cars')
      AND aluno_id IS NULL
  LOOP
    -- Cria a instância do formulário vinculada ao novo aluno
    INSERT INTO public.formularios (
      titulo,
      descricao,
      tipo,
      equipe_id,
      aluno_id,
      protegido,
      ativo
    )
    VALUES (
      v_template.titulo,
      v_template.descricao,
      v_template.tipo,
      NEW.equipe_id,   -- obrigatório: equipe_id do novo aluno
      NEW.id,          -- obrigatório: id do novo aluno
      true,            -- herança de proteção obrigatória
      v_template.ativo
    )
    RETURNING id INTO v_novo_form;

    -- Copia todas as perguntas do template para a nova instância
    FOR v_pergunta IN
      SELECT texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida
      FROM public.perguntas
      WHERE formulario_id = v_template.id
    LOOP
      INSERT INTO public.perguntas (
        formulario_id,
        texto_pergunta,
        tipo_resposta,
        opcoes,
        obrigatoria,
        ordem,
        protegida
      )
      VALUES (
        v_novo_form,
        v_pergunta.texto_pergunta,
        v_pergunta.tipo_resposta,
        v_pergunta.opcoes,
        v_pergunta.obrigatoria,
        v_pergunta.ordem,
        v_pergunta.protegida
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotência)
DROP TRIGGER IF EXISTS on_aluno_created ON public.alunos;

CREATE TRIGGER on_aluno_created
  AFTER INSERT ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_aluno_created();


-- ════════════════════════════════════════════════════════════════════
-- TRG-02 — Propagar Formulário do Circuito para a Sessão
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: quando uma sessão for criada com um circuito que possui
-- formulario_id (Registro de Controle), propagar esse formulario_id
-- para a sessão recém-criada (US7.1: RC disponível imediatamente).
--
-- Critérios atendidos:
--   ✓ AFTER INSERT na tabela sessoes
--   ✓ SECURITY DEFINER
--   ✓ Proteção de sobrescrita: se formulario_id já vier preenchido, aborta
--   ✓ Condição de ignorar: se não houver circuito_id, não altera nada
--   ✓ Herança do circuito: propaga o formulario_id do circuito para a sessão
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_sessao_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formulario_id UUID;
BEGIN
  -- Proteção de sobrescrita (saída rápida):
  -- se o INSERT já trouxe um formulario_id, respeita o dado e não altera nada
  IF NEW.formulario_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Condição de ignorar: sem circuito vinculado, nada a propagar
  IF NEW.circuito_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Herança do circuito: busca o formulario_id do circuito
  SELECT formulario_id
    INTO v_formulario_id
    FROM public.circuitos
   WHERE id = NEW.circuito_id;

  -- Se o circuito não possuir formulário associado, encerra sem alterar
  IF v_formulario_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Propaga o formulario_id do circuito para a sessão recém-criada
  UPDATE public.sessoes
     SET formulario_id = v_formulario_id
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotência)
DROP TRIGGER IF EXISTS on_sessao_created ON public.sessoes;

CREATE TRIGGER on_sessao_created
  AFTER INSERT ON public.sessoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sessao_created();
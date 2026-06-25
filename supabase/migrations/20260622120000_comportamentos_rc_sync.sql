-- ════════════════════════════════════════════════════════════════════
-- Comportamentos derivados do Registro de Controle (RC)
-- ════════════════════════════════════════════════════════════════════
-- 1) Amplia o CHECK de comportamentos_sessao.tipo com 'inapto' e
--    'atividade_preferencial'.
-- 2) Cria sincronizar_comportamentos_rc(p_sessao_id): a partir das respostas do
--    RC da sessão, (re)gera as linhas de comportamentos_sessao derivadas do RC.
--    É idempotente — apaga apenas os tipos derivados do RC e reinsere — então
--    editar o RC no histórico mantém os valores consistentes (adicionar/remover
--    itens reflete corretamente). Crise/fuga/engajamento NÃO são tocados.
--
-- A coluna `observacao` (já existente) guarda o detalhe:
--   • contato_visual          → "pessoas" | "objetos"
--   • atividade_preferencial  → "manipulativa" | "equilíbrio" | "força"
--   • estereotipia / inapto   → nome do item marcado
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.comportamentos_sessao
  DROP CONSTRAINT IF EXISTS comportamentos_sessao_tipo_check;

ALTER TABLE public.comportamentos_sessao
  ADD CONSTRAINT comportamentos_sessao_tipo_check
  CHECK (tipo IN (
    'estereotipia', 'contato_visual', 'engajamento', 'fuga', 'crise', 'outro',
    'inapto', 'atividade_preferencial'
  ));

CREATE OR REPLACE FUNCTION public.sincronizar_comportamentos_rc(
  p_sessao_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_id     uuid;
  v_template_id uuid;
BEGIN
  SELECT formulario_id INTO v_form_id FROM public.sessoes WHERE id = p_sessao_id;
  IF v_form_id IS NULL THEN
    RETURN;
  END IF;

  -- Perguntas vivem no template (template_origem_id); respostas, na instância.
  SELECT COALESCE(template_origem_id, id) INTO v_template_id
  FROM public.formularios WHERE id = v_form_id;

  -- Remove apenas os comportamentos derivados do RC desta sessão.
  DELETE FROM public.comportamentos_sessao
  WHERE sessao_id = p_sessao_id
    AND tipo IN ('contato_visual', 'estereotipia', 'inapto', 'atividade_preferencial')
    AND execucao_id IS NULL;

  -- Sim/Não → contato_visual / atividade_preferencial.
  INSERT INTO public.comportamentos_sessao (sessao_id, tipo, observacao)
  SELECT p_sessao_id, m.tipo, m.observacao
  FROM (VALUES
    ('Contato visual - Pessoas',              'contato_visual',         'pessoas'),
    ('Contato visual - Objetos',              'contato_visual',         'objetos'),
    ('Atividade Preferencial - Manipulativa', 'atividade_preferencial', 'manipulativa'),
    ('Atividade Preferencial - Equilíbrio',   'atividade_preferencial', 'equilíbrio'),
    ('Atividade Preferencial - Força',        'atividade_preferencial', 'força')
  ) AS m(titulo, tipo, observacao)
  JOIN public.perguntas p
    ON p.formulario_id = v_template_id AND p.texto_pergunta = m.titulo
  JOIN public.respostas_formulario r
    ON r.pergunta_id = p.id
   AND r.formulario_id = v_form_id
   AND r.sessao_id = p_sessao_id
  WHERE lower(btrim(r.valor_preenchido, '"')) = 'sim';

  -- Múltipla escolha → estereotipia / inapto (exceto "Nenhuma das opções").
  INSERT INTO public.comportamentos_sessao (sessao_id, tipo, observacao)
  SELECT p_sessao_id, m.tipo, item
  FROM (VALUES
    ('Comportamentos Estereotipados', 'estereotipia'),
    ('Comportamentos Inaptos',        'inapto')
  ) AS m(titulo, tipo)
  JOIN public.perguntas p
    ON p.formulario_id = v_template_id AND p.texto_pergunta = m.titulo
  JOIN public.respostas_formulario r
    ON r.pergunta_id = p.id
   AND r.formulario_id = v_form_id
   AND r.sessao_id = p_sessao_id
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN r.valor_preenchido IS NOT NULL
       AND jsonb_typeof(r.valor_preenchido::jsonb) = 'array'
      THEN r.valor_preenchido::jsonb
      ELSE '[]'::jsonb
    END
  ) AS item
  WHERE item <> 'Nenhuma das opções';
END $$;

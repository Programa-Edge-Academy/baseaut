ALTER TABLE public.formularios
ADD COLUMN IF NOT EXISTS data_avaliacao DATE;

CREATE OR REPLACE VIEW public.vw_historico_avaliacoes_aluno AS
SELECT
  f.aluno_id,
  f.id AS formulario_id,
  f.tipo AS tipo_formulario,
  -- Passo 4: Data de avaliação com fallback para a data de criação
  COALESCE(f.data_avaliacao, f.created_at::DATE) AS data_avaliacao,
  f.created_at,
  COUNT(rf.id) AS total_respostas,
  -- Passo 5: Conversão explícita para somatório numérico
  SUM(rf.valor_preenchido::NUMERIC)::NUMERIC AS pontuacao_total
FROM public.formularios f
LEFT JOIN public.respostas_formulario rf
  ON rf.formulario_id = f.id AND rf.aluno_id = f.aluno_id
WHERE f.tipo IN ('ata', 'cars')
  AND f.aluno_id IS NOT NULL
GROUP BY f.aluno_id, f.id, f.tipo, f.data_avaliacao, f.created_at
ORDER BY f.aluno_id, f.tipo, data_avaliacao DESC;

CREATE OR REPLACE FUNCTION public.criar_nova_avaliacao(
  p_aluno_id UUID,
  p_tipo TEXT, -- 'ata' ou 'cars'
  p_data DATE DEFAULT CURRENT_DATE
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_template_id UUID;
  v_nova_inst_id UUID := gen_random_uuid();
  v_equipe_id UUID;
  v_nome_aluno TEXT;
BEGIN
  -- 1. Buscar dados do aluno para a concatenação
  SELECT equipe_id, nome_completo INTO v_equipe_id, v_nome_aluno
  FROM public.alunos WHERE id = p_aluno_id;

  -- 2. Buscar o template original vazio correspondente
  SELECT id INTO v_template_id
  FROM public.formularios
  WHERE tipo = p_tipo::tipo_formulario AND aluno_id IS NULL LIMIT 1;

  -- Passo 2: Clonar a estrutura concatenando o título com nome e data
  INSERT INTO public.formularios
    (id, titulo, descricao, tipo, equipe_id, aluno_id, protegido, ativo, data_avaliacao)
  SELECT
    v_nova_inst_id,
    UPPER(p_tipo) || ' - ' || v_nome_aluno || ' - ' || TO_CHAR(p_data, 'DD/MM/YYYY'),
    descricao, tipo, v_equipe_id, p_aluno_id, true, true, p_data
  FROM public.formularios WHERE id = v_template_id;

  -- Passo 3: Inserção em bloco (Bulk Insert) das perguntas sem usar loops
  INSERT INTO public.perguntas
    (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  SELECT
    v_nova_inst_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, true
  FROM public.perguntas WHERE formulario_id = v_template_id;

  RETURN v_nova_inst_id;
END;
$$;
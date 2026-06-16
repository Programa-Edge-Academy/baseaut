-- ==============================================================================
-- MIGRATION: US 10.7 - Atualização da leitura do MABC-2
-- Objetivo: Retornar os metadados (totais e percentis) na God Query do formulário
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_mabc2_formulario(
    p_formulario_id UUID
) RETURNS JSONB
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
    v_tpl_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Descobre o template de origem para buscar as perguntas
    SELECT template_origem_id INTO v_tpl_id
    FROM public.formularios 
    WHERE id = p_formulario_id;

    -- 2. Monta o JSONB completo
    SELECT jsonb_build_object(
        
        -- ── Nó Atualizado: Formulário ─────────────────────────────────
        'formulario', jsonb_build_object(
            'id',             f.id,
            'titulo',         f.titulo,
            'faixa',          (f.metadados->>'faixa_mabc')::INT,
            'metadados',      f.metadados,      -- <--- INCLUSÃO DA US 10.7
            'data_avaliacao', f.data_avaliacao, -- <--- INCLUSÃO DA US 10.7
            'created_at',     f.created_at,
            'updated_at',     f.updated_at
        ),
        
        -- ── Dados do Aluno ────────────────────────────────────────────
        'aluno', jsonb_build_object(
            'id',              a.id,
            'nome',            a.nome_completo,
            'data_nascimento', a.data_nascimento,
            'idade',           DATE_PART('year', AGE(CURRENT_DATE, a.data_nascimento))::INT,
            'mao_preferida',   a.mao_preferida
        ),
        
        -- ── Dados do Avaliador ────────────────────────────────────────
        'avaliador', CASE 
            WHEN pr.id IS NOT NULL THEN jsonb_build_object('id', pr.id, 'nome', pr.nome_completo)
            ELSE NULL 
        END,
        
        -- ── Itens do MABC-2 respondidos ───────────────────────────────
        'itens', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'pergunta_id',   p.id,
                    'texto',         p.texto_pergunta,
                    'ordem',         p.ordem,
                    'componente',    p.opcoes->>'componente',
                    'codigo_item',   p.opcoes->>'codigo_item',
                    'sub_item',      p.opcoes->>'sub_item',
                    'unidade',       p.opcoes->>'unidade',
                    'respondido',    (rf.status_item = 'respondido'),
                    'escore_bruto',  CASE WHEN rf.status_item = 'respondido' THEN rf.valor_preenchido::INT ELSE NULL END,
                    'nivel_ajuda',   rf.valor_ajuda->>'nivel',
                    'complementos',  rf.valor_ajuda->'complementos',
                    'status_item',   COALESCE(rf.status_item::TEXT, 'sem_resposta')
                ) ORDER BY p.ordem
            ), '[]'::jsonb)
            FROM public.perguntas p
            LEFT JOIN public.respostas_formulario rf 
                   ON rf.pergunta_id = p.id AND rf.formulario_id = p_formulario_id
            WHERE p.formulario_id = v_tpl_id
        ),
        
        -- ── Mapeamento de Status ──────────────────────────────────────
        'resumo_pendencias', (
            SELECT jsonb_build_object(
                'total_itens',    COUNT(p.id),
                'respondidos',    COUNT(rf.id) FILTER (WHERE rf.status_item = 'respondido'),
                'adiados',        COUNT(rf.id) FILTER (WHERE rf.status_item = 'adiado'),
                'nao_realizados', COUNT(rf.id) FILTER (WHERE rf.status_item = 'nao_realizado'),
                'sem_resposta',   COUNT(p.id) - COUNT(rf.id),
                'tem_pendencia',  (COUNT(p.id) > COUNT(rf.id) FILTER (WHERE rf.status_item = 'respondido'))
            )
            FROM public.perguntas p
            LEFT JOIN public.respostas_formulario rf 
                   ON rf.pergunta_id = p.id AND rf.formulario_id = p_formulario_id
            WHERE p.formulario_id = v_tpl_id
        )
    ) INTO v_result
    FROM public.formularios f
    JOIN public.alunos a ON a.id = f.aluno_id
    LEFT JOIN public.profiles pr ON pr.id = f.avaliador_id
    WHERE f.id = p_formulario_id;

    RETURN v_result;
END;
$$;
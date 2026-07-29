CREATE OR REPLACE VIEW public.vw_linha_do_tempo_aluno AS
-- 1. Metade Superior: Sessões de circuito
SELECT
    s.aluno_id,
    s.equipe_id,
    s.id AS evento_id,
    'sessao' AS tipo_evento,
    s.data_inicio AS data_evento,
    s.status::TEXT AS status_evento,
    jsonb_build_object(
        'circuito_nome', c.titulo,
        'monitor_nome', pr.nome_completo,
        'status', s.status
    ) AS metadados
FROM public.sessoes s
LEFT JOIN public.circuitos c ON c.id = s.circuito_id
LEFT JOIN public.profiles pr ON pr.id = s.monitor_id

UNION ALL

-- 2. Metade Inferior: Formulários (ATA, CARS, MABC-2, RC)
SELECT
    f.aluno_id,
    f.equipe_id,
    f.id AS evento_id,
    f.tipo::TEXT AS tipo_evento,
    f.created_at AS data_evento,
    
    -- Lógica de Pendência: verifica se existe pergunta obrigatória sem resposta ou adiada
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.perguntas p
            LEFT JOIN public.respostas_formulario rf 
                   ON rf.pergunta_id = p.id AND rf.formulario_id = f.id
            -- COALESCE garante que ache as perguntas seja no template ou na própria instância
            WHERE p.formulario_id = COALESCE(f.template_origem_id, f.id)
              AND p.obrigatoria = TRUE
              AND (rf.id IS NULL OR rf.status_item = 'adiado')
        ) THEN 'pendente'
        ELSE 'completo'
    END AS status_evento,
    
    jsonb_build_object(
        'titulo', f.titulo,
        'avaliador_nome', pr2.nome_completo,
        'faixa_mabc', (f.metadados->>'faixa_mabc')::INT
    ) AS metadados
FROM public.formularios f
LEFT JOIN public.profiles pr2 ON pr2.id = f.avaliador_id
WHERE f.aluno_id IS NOT NULL
  AND f.protegido = FALSE; -- Ignora templates globais, pega só instâncias aplicadas
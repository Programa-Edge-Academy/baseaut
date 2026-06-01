CREATE OR REPLACE FUNCTION public.get_resultado_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH execucoes_consolidadas AS (
    SELECT
        ee.id,
        e.titulo,
        ee.ordem_execucao,
        ee.status_realizacao,
        ee.nivel_desenvolvimento,
        ee.registro_ajuda,
        ee.complementos_ajuda,
        ee.motivo_nao_realizacao,
        ee.descricao_adicional,
        ee.duracao_real_segundos,
    
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', rs.id,
                    'tipo', rs.tipo,
                    'intensidade', rs.intensidade,
                    'observacao', rs.observacao,
                    'created_at', rs.created_at
                )
                ORDER BY rs.created_at
            ) FILTER (WHERE rs.id IS NOT NULL),
            '[]'::jsonb
        ) AS registros_suporte
    FROM public.execucoes_exercicio ee
    INNER JOIN public.exercicios e ON e.id = ee.exercicio_id
    LEFT JOIN public.registros_suporte rs ON rs.execucao_id = ee.id
    WHERE ee.sessao_id = p_sessao_id
    GROUP BY
        ee.id, e.titulo, ee.ordem_execucao,
        ee.status_realizacao, ee.nivel_desenvolvimento, 
        ee.registro_ajuda, ee.complementos_ajuda, 
        ee.motivo_nao_realizacao, ee.descricao_adicional, 
        ee.duracao_real_segundos
)
SELECT jsonb_build_object(
    'exercicios', (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'titulo', titulo,
                    'ordem_execucao', ordem_execucao,
                    'status_realizacao', status_realizacao,
                    'nivel_desenvolvimento', nivel_desenvolvimento,
                    'registro_ajuda', registro_ajuda,
                    'complementos_ajuda', complementos_ajuda,
                    'motivo_nao_realizacao', motivo_nao_realizacao,
                    'descricao_adicional', descricao_adicional,
                    'duracao_real_segundos', duracao_real_segundos,
                    'registros_suporte', registros_suporte
                )
                ORDER BY ordem_execucao
            ),
            '[]'::jsonb
        ) FROM execucoes_consolidadas
    ),
    'registro_controle_id', (
        SELECT formulario_id FROM public.sessoes WHERE id = p_sessao_id
    )
);
$$;

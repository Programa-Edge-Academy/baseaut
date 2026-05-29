CREATE OR REPLACE FUNCTION public.get_resultado_sessao(p_sessao_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT COALESCE(
    jsonb_agg(
        jsonb_build_object(
            'id', ee.id,
            'titulo', e.titulo,
            'ordem_execucao', ee.ordem_execucao,
            'registros_suporte',
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', rs.id,
                                'tipo', rs.tipo,
                                'intensidade', rs.intensidade,
                                'observacao', rs.observacao,
                                'created_at', rs.created_at
                            )
                            ORDER BY rs.created_at
                        )
                        FROM public.registros_suporte rs
                        WHERE rs.execucao_id = ee.id
                          AND rs.id IS NOT NULL
                    ),
                    '[]'::jsonb
                )
        )
        ORDER BY ee.ordem_execucao
    ),
    '[]'::jsonb
)
FROM public.execucoes_exercicio ee
INNER JOIN public.exercicios e
        ON e.id = ee.exercicio_id
WHERE ee.sessao_id = p_sessao_id;
$$;
CREATE OR REPLACE FUNCTION public.rpc_get_painel_analises_aluno(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_equipe_id UUID;
    v_resultado JSONB;
BEGIN
    -- 1. Buscar equipe e validar existência do aluno
    SELECT equipe_id INTO v_equipe_id
    FROM public.alunos
    WHERE id = p_aluno_id;

    IF v_equipe_id IS NULL THEN
        RAISE EXCEPTION 'Aluno não encontrado ou sem equipe vinculada.';
    END IF;

    -- 2. Trava de segurança: valida se o usuário tem acesso à equipe do aluno
    -- can_access_team valida se o auth.uid() é membro ou coordenador da equipe
    IF NOT public.can_access_team(v_equipe_id) THEN
        RAISE EXCEPTION 'Acesso negado: você não tem permissão para visualizar os dados deste aluno.';
    END IF;

    -- 3. Montagem do Payload Consolidado via CTEs
    WITH 
      node_aluno AS (
        SELECT 
          jsonb_build_object(
            'id', id,
            'nome_completo', nome_completo,
            'avatar_url', avatar_url,
            'data_nascimento', data_nascimento,
            'peso', peso,
            'altura', altura,
            'cintura', cintura,
            'nivel_suporte', nivel_suporte,
            'diagnostico_detalhado', diagnostico_detalhado,
            'observacoes_clinicas', observacoes_clinicas,
            'idade', DATE_PART('year', AGE(data_nascimento))
          ) AS data
        FROM public.alunos
        WHERE id = p_aluno_id
      ),
      node_estatisticas AS (
        SELECT 
          jsonb_build_object(
            'total_sessoes', COUNT(*),
            'ultima_sessao', MAX(data_inicio)
          ) AS data
        FROM public.sessoes
        WHERE aluno_id = p_aluno_id
          AND status = 'concluida' -- Mapeado de 'finalizada' para o enum real do DB (status_sessao)
      ),
      node_protocolos AS (
        SELECT 
          COALESCE(jsonb_agg(
            jsonb_build_object(
              'tipo', t.tipo,
              'total_avaliacoes', COALESCE(f.total, 0),
              'ultima_avaliacao', f.ultima,
              'status', CASE WHEN COALESCE(f.total, 0) > 0 THEN 'disponivel' ELSE 'nao_iniciado' END,
              'aviso', CASE WHEN t.tipo = 'mabc2' THEN 'Dados armazenados sem cálculo automático de Escore-Padrão ou Percentil...' ELSE NULL END
            )
          ), '[]'::jsonb) AS data
        FROM (
          SELECT unnest(ARRAY['ata', 'cars', 'mabc2']) AS tipo
        ) t
        LEFT JOIN (
          SELECT 
            tipo::text, 
            COUNT(*) AS total, 
            MAX(updated_at) AS ultima
          FROM public.formularios
          WHERE aluno_id = p_aluno_id
            AND protegido = FALSE -- Indica que é uma instância de avaliação do aluno, não um template
            AND tipo::text IN ('ata', 'cars', 'mabc2')
          GROUP BY tipo
        ) f ON f.tipo = t.tipo
      )
    SELECT 
      jsonb_build_object(
        'aluno', (SELECT data FROM node_aluno),
        'estatisticas', (SELECT data FROM node_estatisticas),
        'protocolos', (SELECT data FROM node_protocolos)
      )
    INTO v_resultado;

    RETURN v_resultado;
END;
$$;

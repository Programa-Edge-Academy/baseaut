CREATE OR REPLACE FUNCTION rpc_get_estado_protocolos(p_aluno_id UUID)
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

  -- Passo 1: Segurança — Validação de Equipe e Acesso
  SELECT equipe_id INTO v_equipe_id FROM public.alunos WHERE id = p_aluno_id;

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado ou sem equipe vinculada.';
  END IF;

  IF NOT public.can_access_team(v_equipe_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não tem permissão para visualizar os dados deste aluno.';
  END IF;

  -- Passos 2, 3 e 4: CTE de mapeamento + LEFT JOIN + retorno estrito
  WITH protocolos_base AS (
    SELECT
      p.protocolo,
      f.id AS formulario_id
    FROM unnest(ARRAY['ata', 'cars', 'mabc2']) AS p(protocolo)
    LEFT JOIN public.formularios f
      ON  f.aluno_id  = p_aluno_id
      AND f.tipo      = p.protocolo
      AND f.protegido = FALSE
  )
  
  SELECT jsonb_agg(
    json_build_object(
      'protocolo', protocolo,
      'status',    CASE WHEN formulario_id IS NOT NULL
                     THEN 'Registrado'
                     ELSE 'Nao registrado'
                   END
    )
    ORDER BY protocolo
  )
  INTO v_resultado
  FROM protocolos_base;

  RETURN jsonb_build_object(
    'ok',         TRUE,
    'aluno_id',   p_aluno_id,
    'protocolos', COALESCE(v_resultado, '[]'::jsonb)
  );

END;
$$;
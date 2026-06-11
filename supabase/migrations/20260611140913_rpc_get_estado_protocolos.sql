CREATE OR REPLACE FUNCTION rpc_get_estado_protocolos(p_aluno_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resultado JSON;
BEGIN

  -- Passo 1: Segurança — valida se o aluno existe
  IF NOT EXISTS (
    SELECT 1 FROM alunos WHERE id = p_aluno_id
  ) THEN
    RETURN json_build_object(
      'ok', FALSE,
      'erro', 'Aluno não encontrado'
    );
  END IF;

  -- Passos 2, 3 e 4: CTE de mapeamento + LEFT JOIN + retorno estrito
  SELECT json_agg(
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
  FROM (
    SELECT
      p.protocolo,
      f.id AS formulario_id
    FROM unnest(ARRAY['ata', 'cars', 'mabc2']) AS p(protocolo)
    LEFT JOIN formularios f
      ON  f.aluno_id  = p_aluno_id
      AND f.tipo      = p.protocolo
      AND f.protegido = FALSE
  ) sub;

  RETURN json_build_object(
    'ok',        TRUE,
    'aluno_id',  p_aluno_id,
    'protocolos', v_resultado
  );

END;
$$;
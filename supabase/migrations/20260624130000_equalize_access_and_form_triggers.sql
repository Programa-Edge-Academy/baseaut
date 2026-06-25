-- ════════════════════════════════════════════════════════════════════
-- Acesso monitor = coordenador (exceto gestão de equipe) + ajustes de forms
-- ════════════════════════════════════════════════════════════════════
-- 1. Remove a criação automática de instâncias ATA/CARS no cadastro de aluno.
-- 2. Garante que circuitos "padrão" tenham o template de RC vinculado (backfill),
--    para que a instância de RC seja criada por sessão sem depender do fallback.
-- 3. Equaliza as RLS de escrita clínica e de relatórios: qualquer membro da
--    equipe (monitor OU coordenador) pode escrever — não apenas o monitor dono
--    da sessão / coordenador. Gestão de equipe continua exclusiva do coordenador.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Sem ATA/CARS automáticos no cadastro de aluno ────────────────────────
-- As instâncias de ATA/CARS passam a ser criadas sob demanda (criar_nova_avaliacao).
DROP TRIGGER IF EXISTS on_aluno_created ON public.alunos;

-- ── 2. Backfill: circuitos padrão sem RC recebem o template global ──────────
UPDATE public.circuitos c
SET formulario_id = (
  SELECT f.id
  FROM public.formularios f
  WHERE f.tipo = 'registro_controle'
    AND f.aluno_id IS NULL
    AND f.ativo = true
  ORDER BY f.protegido DESC
  LIMIT 1
)
WHERE c.formulario_id IS NULL
  AND c.tipo = 'padrao'
  AND EXISTS (
    SELECT 1 FROM public.formularios f
    WHERE f.tipo = 'registro_controle' AND f.aluno_id IS NULL AND f.ativo = true
  );

-- ── 2b. Remove o fallback de RC: a instância passa a vir só do circuito ──────
-- (Com o backfill acima, todo circuito padrão tem o template; o fallback ao
-- template global deixa de ser necessário.)
CREATE OR REPLACE FUNCTION public.handle_sessao_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template     RECORD;
  v_nova_inst_id UUID := gen_random_uuid();
  v_aluno_nome   TEXT;
BEGIN
  IF NEW.formulario_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.circuito_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT f.* INTO v_template
  FROM public.circuitos c
  JOIN public.formularios f ON f.id = c.formulario_id
  WHERE c.id = NEW.circuito_id;

  IF v_template.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT nome_completo INTO v_aluno_nome
  FROM public.alunos
  WHERE id = NEW.aluno_id;

  INSERT INTO public.formularios (
    id, titulo, descricao, tipo, equipe_id, aluno_id,
    protegido, ativo, template_origem_id, data_avaliacao, avaliador_id
  )
  VALUES (
    v_nova_inst_id,
    'RC - ' || COALESCE(v_aluno_nome, 'Aluno') || ' - Sessão ' || TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY'),
    v_template.descricao,
    v_template.tipo,
    NEW.equipe_id,
    NEW.aluno_id,
    false,
    true,
    v_template.id,
    CURRENT_DATE,
    NEW.monitor_id
  );

  NEW.formulario_id := v_nova_inst_id;

  RETURN NEW;
END;
$$;

-- ── 3. RLS: monitor e coordenador têm o mesmo acesso (via can_access_team) ───

-- SESSOES ---------------------------------------------------------------------
DROP POLICY IF EXISTS "sessoes: monitor select own"     ON public.sessoes;
DROP POLICY IF EXISTS "sessoes: coordinator select all" ON public.sessoes;
DROP POLICY IF EXISTS "sessoes: monitor insert"         ON public.sessoes;
DROP POLICY IF EXISTS "sessoes: monitor update own"     ON public.sessoes;

CREATE POLICY "sessoes: team select"
  ON public.sessoes
  FOR SELECT
  USING (public.can_access_team(equipe_id));

CREATE POLICY "sessoes: team insert"
  ON public.sessoes
  FOR INSERT
  WITH CHECK (
    monitor_id = auth.uid()
    AND public.can_access_team(equipe_id)
    AND EXISTS (
      SELECT 1 FROM public.alunos a
      WHERE a.id = sessoes.aluno_id AND a.equipe_id = sessoes.equipe_id
    )
    AND (
      circuito_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.circuitos c
        WHERE c.id = sessoes.circuito_id AND c.equipe_id = sessoes.equipe_id
      )
    )
  );

CREATE POLICY "sessoes: team update"
  ON public.sessoes
  FOR UPDATE
  USING (public.can_access_team(equipe_id))
  WITH CHECK (
    public.can_access_team(equipe_id)
    AND EXISTS (
      SELECT 1 FROM public.alunos a
      WHERE a.id = sessoes.aluno_id AND a.equipe_id = sessoes.equipe_id
    )
    AND (
      circuito_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.circuitos c
        WHERE c.id = sessoes.circuito_id AND c.equipe_id = sessoes.equipe_id
      )
    )
  );

-- EXECUCOES_EXERCICIO ---------------------------------------------------------
DROP POLICY IF EXISTS "execucoes: insert session owner" ON public.execucoes_exercicio;
DROP POLICY IF EXISTS "execucoes: update session owner" ON public.execucoes_exercicio;

CREATE POLICY "execucoes: insert team"
  ON public.execucoes_exercicio
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.exercicios e ON e.id = execucoes_exercicio.exercicio_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = execucoes_exercicio.sessao_id
        AND public.can_access_team(a.equipe_id)
        AND e.equipe_id = a.equipe_id
    )
  );

CREATE POLICY "execucoes: update team"
  ON public.execucoes_exercicio
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = execucoes_exercicio.sessao_id
        AND public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.exercicios e ON e.id = execucoes_exercicio.exercicio_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = execucoes_exercicio.sessao_id
        AND public.can_access_team(a.equipe_id)
        AND e.equipe_id = a.equipe_id
    )
  );

-- RESPOSTAS_FORMULARIO --------------------------------------------------------
DROP POLICY IF EXISTS "respostas: insert session owner" ON public.respostas_formulario;
DROP POLICY IF EXISTS "respostas: update session owner" ON public.respostas_formulario;

CREATE POLICY "respostas: insert team"
  ON public.respostas_formulario
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.perguntas p ON p.id = respostas_formulario.pergunta_id
      JOIN public.formularios f ON f.id = p.formulario_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND public.can_access_team(a.equipe_id)
        AND f.equipe_id = a.equipe_id
    )
  );

CREATE POLICY "respostas: update team"
  ON public.respostas_formulario
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.perguntas p ON p.id = respostas_formulario.pergunta_id
      JOIN public.formularios f ON f.id = p.formulario_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND public.can_access_team(a.equipe_id)
        AND f.equipe_id = a.equipe_id
    )
  );

-- REGISTROS_SUPORTE -----------------------------------------------------------
DROP POLICY IF EXISTS "suporte: insert session owner" ON public.registros_suporte;
DROP POLICY IF EXISTS "suporte: update session owner" ON public.registros_suporte;

CREATE POLICY "suporte: insert team"
  ON public.registros_suporte
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.execucoes_exercicio ee
      JOIN public.sessoes s ON s.id = ee.sessao_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE ee.id = registros_suporte.execucao_id
        AND public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "suporte: update team"
  ON public.registros_suporte
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.execucoes_exercicio ee
      JOIN public.sessoes s ON s.id = ee.sessao_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE ee.id = registros_suporte.execucao_id
        AND public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.execucoes_exercicio ee
      JOIN public.sessoes s ON s.id = ee.sessao_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE ee.id = registros_suporte.execucao_id
        AND public.can_access_team(a.equipe_id)
    )
  );

-- RELATORIOS / SECOES / MIDIAS ------------------------------------------------
-- Qualquer membro da equipe (monitor ou coordenador) pode criar, editar e
-- remover QUALQUER relatório da própria equipe — sem restrição por autor.
DROP POLICY IF EXISTS "relatorios: coordinator manages" ON public.relatorios;
CREATE POLICY "relatorios: team manages"
  ON public.relatorios
  FOR ALL
  USING (
    aluno_id IN (
      SELECT a.id FROM public.alunos a WHERE public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    aluno_id IN (
      SELECT a.id FROM public.alunos a WHERE public.can_access_team(a.equipe_id)
    )
  );

DROP POLICY IF EXISTS "secoes: manage via own relatorio" ON public.secoes_relatorio;
CREATE POLICY "secoes: manage via own relatorio team"
  ON public.secoes_relatorio
  FOR ALL
  USING (
    relatorio_id IN (
      SELECT r.id
      FROM public.relatorios r
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    relatorio_id IN (
      SELECT r.id
      FROM public.relatorios r
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE public.can_access_team(a.equipe_id)
    )
  );

DROP POLICY IF EXISTS "midias: manage via own relatorio" ON public.midias;
CREATE POLICY "midias: manage via own relatorio team"
  ON public.midias
  FOR ALL
  USING (
    secao_id IN (
      SELECT sr.id
      FROM public.secoes_relatorio sr
      JOIN public.relatorios r ON r.id = sr.relatorio_id
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    secao_id IN (
      SELECT sr.id
      FROM public.secoes_relatorio sr
      JOIN public.relatorios r ON r.id = sr.relatorio_id
      JOIN public.alunos a ON a.id = r.aluno_id
      WHERE public.can_access_team(a.equipe_id)
    )
  );

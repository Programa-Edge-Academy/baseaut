-- ================================================================
-- 15. SESSOES
-- Regra:
--   SELECT Monitor     → apenas sessões próprias.
--   SELECT Coordenador → sessões dos alunos da sua equipe.
--   INSERT/UPDATE      → apenas Monitor responsável pela própria sessão.
--   DELETE             → sem policy; sessão é histórico/auditoria.
--
-- Alteração crítica: INSERT/UPDATE agora validam:
--   a) usuário autenticado é Monitor;
--   b) monitor_id = auth.uid();
--   c) aluno pertence a equipe acessível pelo monitor;
--   d) circuito opcional pertence à mesma equipe do aluno.
-- ================================================================

CREATE POLICY "sessoes: monitor select own"
  ON public.sessoes
  FOR SELECT
  USING (
    monitor_id = auth.uid()
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) = 'monitor'
  );

CREATE POLICY "sessoes: coordinator select all"
  ON public.sessoes
  FOR SELECT
  USING (
    public.is_coordinator()
    AND aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE public.is_team_coordinator(a.equipe_id)
    )
  );

CREATE POLICY "sessoes: monitor insert"
  ON public.sessoes
  FOR INSERT
  WITH CHECK (
    monitor_id = auth.uid()
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) = 'monitor'
    AND EXISTS (
      SELECT 1
      FROM public.alunos a
      WHERE a.id = sessoes.aluno_id
        AND public.is_team_member(a.equipe_id)
    )
    AND (
      circuito_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.alunos a
        JOIN public.circuitos c ON c.id = sessoes.circuito_id
        WHERE a.id = sessoes.aluno_id
          AND c.equipe_id = a.equipe_id
          AND public.is_team_member(a.equipe_id)
      )
    )
  );

CREATE POLICY "sessoes: monitor update own"
  ON public.sessoes
  FOR UPDATE
  USING (
    monitor_id = auth.uid()
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) = 'monitor'
  )
  WITH CHECK (
    monitor_id = auth.uid()
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) = 'monitor'
    AND EXISTS (
      SELECT 1
      FROM public.alunos a
      WHERE a.id = sessoes.aluno_id
        AND public.is_team_member(a.equipe_id)
    )
    AND (
      circuito_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.alunos a
        JOIN public.circuitos c ON c.id = sessoes.circuito_id
        WHERE a.id = sessoes.aluno_id
          AND c.equipe_id = a.equipe_id
          AND public.is_team_member(a.equipe_id)
      )
    )
  );

-- Justificativa: evita criação de sessão para aluno de outra equipe e corrige
-- o erro do ajuste antigo que tentava usar sessoes.equipe_id, coluna inexistente
-- no schema do Roadmap.


-- ================================================================
-- 16. EXECUCOES_EXERCICIO
-- Regra:
--   SELECT → quem pode ver a sessão pode ver as execuções.
--   INSERT/UPDATE → usuário responsável pela sessão.
--   DELETE → sem policy; execução compõe histórico da sessão.
-- ================================================================

CREATE POLICY "execucoes: select via sessao"
  ON public.execucoes_exercicio
  FOR SELECT
  USING (
    sessao_id IN (SELECT s.id FROM public.sessoes s)
  );

CREATE POLICY "execucoes: insert session owner"
  ON public.execucoes_exercicio
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.exercicios e ON e.id = execucoes_exercicio.exercicio_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = execucoes_exercicio.sessao_id
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND e.equipe_id = a.equipe_id
    )
  );

CREATE POLICY "execucoes: update session owner"
  ON public.execucoes_exercicio
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = execucoes_exercicio.sessao_id
        AND s.monitor_id = auth.uid()
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
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND e.equipe_id = a.equipe_id
    )
  );

-- Justificativa de negócio:
--   Normalmente a execução é registrada pelo Monitor responsável pela sessão.
--   Porém, devido à baixa disponibilidade de monitores, o Coordenador também
--   pode participar diretamente da execução de sessões.
--
--   Por isso, a escrita não deve ser limitada ao role = 'monitor'.
--   A regra correta é: quem está em sessoes.monitor_id é o responsável
--   operacional daquela sessão e pode registrar/editar suas execuções,
--   independentemente de o perfil ser 'monitor' ou 'coordenador'.
--
-- Alteração em relação à policy antiga:
--   A policy antiga FOR ALL via SELECT de sessoes permitia que qualquer
--   Coordenador que conseguisse visualizar a sessão também escrevesse
--   execuções. Isso era amplo demais.
--
--   Agora leitura e escrita são separadas:
--     - SELECT herda a visibilidade da sessão;
--     - INSERT/UPDATE exigem que auth.uid() seja o responsável da sessão.
--
-- Validações mantidas:
--   - A sessão precisa pertencer a um aluno de equipe acessível ao usuário.
--   - O exercício executado precisa pertencer à mesma equipe do aluno.
--   - O usuário precisa ser o responsável operacional da sessão.

-- ================================================================
-- 17. REGISTROS_SUPORTE
-- Regra:
--   SELECT → quem pode ver a execução/sessão pode ver o suporte.
--   INSERT/UPDATE → usuário responsável pela sessão.
--   DELETE → sem policy; suporte é dado diagnóstico histórico.
--
-- Justificativa de negócio:
--   Normalmente os registros de suporte são lançados pelo Monitor durante
--   a execução da sessão.
--
--   Porém, pela regra real de operação, o Coordenador também pode participar
--   diretamente das sessões quando há baixa disponibilidade de monitores.
--
--   Por isso, a escrita não deve ser limitada ao role = 'monitor'.
--   A regra correta é: quem está em sessoes.monitor_id é o responsável
--   operacional daquela sessão e pode registrar/editar os suportes,
--   independentemente de o perfil ser 'monitor' ou 'coordenador'.
--
-- Alteração em relação à policy antiga:
--   A policy antiga FOR ALL via SELECT de execucoes/sessoes permitia que
--   usuários que apenas visualizavam a sessão também escrevessem suporte.
--   Isso era amplo demais.
--
--   Agora leitura e escrita são separadas:
--     - SELECT herda a visibilidade da execução/sessão;
--     - INSERT/UPDATE exigem que auth.uid() seja o responsável da sessão.
--
-- Validações mantidas:
--   - O suporte precisa pertencer a uma execução existente.
--   - A execução precisa pertencer a uma sessão existente.
--   - A sessão precisa pertencer a um aluno de equipe acessível ao usuário.
--   - O usuário precisa ser o responsável operacional da sessão.
-- ================================================================

CREATE POLICY "suporte: select via execucao"
  ON public.registros_suporte
  FOR SELECT
  USING (
    execucao_id IN (
      SELECT ee.id
      FROM public.execucoes_exercicio ee
    )
  );

CREATE POLICY "suporte: insert session owner"
  ON public.registros_suporte
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.execucoes_exercicio ee
      JOIN public.sessoes s ON s.id = ee.sessao_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE ee.id = registros_suporte.execucao_id
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
    )
  );

CREATE POLICY "suporte: update session owner"
  ON public.registros_suporte
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.execucoes_exercicio ee
      JOIN public.sessoes s ON s.id = ee.sessao_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE ee.id = registros_suporte.execucao_id
        AND s.monitor_id = auth.uid()
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
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
    )
  );

-- Justificativa: registros_suporte é o coração diagnóstico do BaseAut.
-- A cadeia permanece: suporte → execução → sessão → responsável operacional
-- da sessão → aluno/equipe.

-- ================================================================
-- 18. RESPOSTAS_FORMULARIO
-- Regra:
--   SELECT → quem pode ver a sessão pode ver respostas.
--   INSERT/UPDATE → usuário responsável pela sessão.
--   DELETE → sem policy; respostas compõem histórico da sessão.
--
-- Justificativa de negócio:
--   Normalmente as respostas do formulário são registradas pelo Monitor
--   responsável pela sessão.
--
--   Porém, como o Coordenador também pode participar diretamente da execução
--   de sessões, ele também precisa registrar/editar respostas quando for o
--   responsável operacional daquela sessão.
--
--   Por isso, a escrita não deve ser limitada ao role = 'monitor'.
--   A regra correta é: quem está em sessoes.monitor_id é o responsável
--   operacional da sessão e pode registrar/editar respostas do formulário,
--   independentemente de o perfil ser 'monitor' ou 'coordenador'.
--
-- Alteração em relação à policy antiga:
--   A policy antiga FOR ALL via SELECT de sessoes permitia que quem apenas
--   visualizava a sessão também escrevesse respostas.
--
--   Agora leitura e escrita são separadas:
--     - SELECT herda a visibilidade da sessão;
--     - INSERT/UPDATE exigem que auth.uid() seja o responsável da sessão.
--
-- Validações mantidas:
--   - A resposta precisa pertencer à sessão.
--   - A pergunta precisa pertencer ao formulário acoplado ao circuito da sessão.
--   - O formulário precisa pertencer à mesma equipe do aluno da sessão.
--   - O usuário precisa ser o responsável operacional da sessão.
-- ================================================================

CREATE POLICY "respostas: select via sessao"
  ON public.respostas_formulario
  FOR SELECT
  USING (
    sessao_id IN (
      SELECT s.id
      FROM public.sessoes s
    )
  );

CREATE POLICY "respostas: insert session owner"
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
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND f.equipe_id = a.equipe_id
        AND s.circuito_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.circuitos c
          WHERE c.id = s.circuito_id
            AND c.formulario_id = f.id
            AND c.equipe_id = a.equipe_id
        )
    )
  );

CREATE POLICY "respostas: update session owner"
  ON public.respostas_formulario
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND s.monitor_id = auth.uid()
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
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND f.equipe_id = a.equipe_id
        AND s.circuito_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.circuitos c
          WHERE c.id = s.circuito_id
            AND c.formulario_id = f.id
            AND c.equipe_id = a.equipe_id
        )
    )
  );

-- Justificativa: respostas pertencem à sessão. O formulário/pergunta precisa
-- pertencer ao formulário acoplado ao circuito da sessão e à mesma equipe do
-- aluno, evitando respostas para formulários de outra equipe ou outro circuito.
--
-- A escrita fica restrita ao responsável operacional da sessão, permitindo
-- Monitor ou Coordenador quando estiverem conduzindo a sessão.
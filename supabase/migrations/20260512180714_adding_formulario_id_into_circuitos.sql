-- Alteração da Tabela Circuitos
ALTER TABLE public.circuitos 
ADD COLUMN formulario_id UUID REFERENCES public.formularios(id) ON DELETE SET NULL;


-- Reset da Policy de Respostas
DROP POLICY IF EXISTS "respostas: insert session owner" ON public.respostas_formulario;

-- Garante que a pergunta respondida pertence ao formulário que está no circuito da sessão
CREATE POLICY "respostas: insert session owner"
  ON public.respostas_formulario
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sessoes s
      JOIN public.circuitos c ON c.id = s.circuito_id
      JOIN public.perguntas p ON p.id = respostas_formulario.pergunta_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND c.formulario_id = p.formulario_id 
    )
  );

-- Atualização da Policy de Update (Seguindo a mesma lógica)
DROP POLICY IF EXISTS "respostas: update session owner" ON public.respostas_formulario;

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
      JOIN public.circuitos c ON c.id = s.circuito_id
      JOIN public.perguntas p ON p.id = respostas_formulario.pergunta_id
      JOIN public.alunos a ON a.id = s.aluno_id
      WHERE s.id = respostas_formulario.sessao_id
        AND s.monitor_id = auth.uid()
        AND public.can_access_team(a.equipe_id)
        AND c.formulario_id = p.formulario_id
    )
  );
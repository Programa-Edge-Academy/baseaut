-- FORMULÁRIOS
-- Bloquear UPDATE em formulários protegidos
DROP POLICY IF EXISTS "formularios: bloquear update protegido" ON public.formularios;
CREATE POLICY "formularios: bloquear update protegido" ON public.formularios
  FOR UPDATE USING (protegido = false);

-- Bloquear DELETE em formulários protegidos
DROP POLICY IF EXISTS "formularios: bloquear delete protegido" ON public.formularios;
CREATE POLICY "formularios: bloquear delete protegido" ON public.formularios
  FOR DELETE USING (protegido = false);

-- Permitir SELECT apenas para membros da mesma equipe
DROP POLICY IF EXISTS "formularios: select team" ON public.formularios;
CREATE POLICY "formularios: select team" ON public.formularios
  FOR SELECT USING (
    -- 1. Libera leitura dos templates globais (ATA, CARS e RC) para TODAS as equipes
    aluno_id IS NULL 
    OR 
    -- 2. Isola os formulários instanciados apenas para a equipe dona do aluno
    public.is_team_member(equipe_id) 
  );

-- PERGUNTAS
-- Bloquear UPDATE em perguntas protegidas
DROP POLICY IF EXISTS "perguntas: bloquear update" ON public.perguntas;
CREATE POLICY "perguntas: bloquear update" ON public.perguntas
  FOR UPDATE USING (protegida = false);

-- Bloquear DELETE em perguntas protegidas
DROP POLICY IF EXISTS "perguntas: bloquear delete" ON public.perguntas;
CREATE POLICY "perguntas: bloquear delete" ON public.perguntas
  FOR DELETE USING (protegida = false);

-- Bloquear INSERT de perguntas em formulários que já estão protegidos
DROP POLICY IF EXISTS "perguntas: bloquear insert em protegido" ON public.perguntas;
CREATE POLICY "perguntas: bloquear insert em protegido" ON public.perguntas
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.formularios
      WHERE id = formulario_id AND protegido = true
    )
  );


DROP POLICY IF EXISTS "respostas: via sessao" ON public.respostas_formulario;

CREATE POLICY "respostas: via sessão ou aluno" ON public.respostas_formulario
  FOR ALL USING (
    -- Caso 1: Registro de Controle (vinculado à sessão)
    (sessao_id IS NOT NULL AND sessao_id IN (SELECT id FROM public.sessoes))
    OR
    -- Caso 2: ATA e CARS (vinculados diretamente ao aluno do time)
    (aluno_id IS NOT NULL AND aluno_id IN (
       SELECT id FROM public.alunos WHERE public.is_team_member(equipe_id)
    ))
  );
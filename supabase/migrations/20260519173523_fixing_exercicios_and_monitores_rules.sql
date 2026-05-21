-- Adicionando duração, tag e ícone para os exercícios
ALTER TABLE public.exercicios 
ADD COLUMN duracao_segundos INTEGER,
ADD COLUMN tag TEXT,
ADD COLUMN icone_url TEXT;


-- Coordenadores podem visualizar monitores pendentes
CREATE POLICY "profiles: coordenador visualiza pendentes"
  ON public.profiles
  FOR SELECT
  USING (
    public.is_coordinator() 
    AND role = 'monitor' 
    AND status_conta = 'pendente'
  );


-- Monitores podem inserir e atualizar alunos em suas equipes
DROP POLICY IF EXISTS "alunos: insert coordinator" ON public.alunos;
DROP POLICY IF EXISTS "alunos: update coordinator" ON public.alunos;

CREATE POLICY "alunos: insert team member"
  ON public.alunos
  FOR INSERT
  WITH CHECK (public.can_access_team(equipe_id));

CREATE POLICY "alunos: update team member"
  ON public.alunos
  FOR UPDATE
  USING (public.can_access_team(equipe_id))
  WITH CHECK (public.can_access_team(equipe_id));


-- Dando permissão para tudo menos DELETE
DROP POLICY IF EXISTS "exercicios: write team" ON public.exercicios;

-- Insert
CREATE POLICY "exercicios: insert team"
  ON public.exercicios
  FOR INSERT
  WITH CHECK (public.can_access_team(equipe_id));

-- Update
CREATE POLICY "exercicios: update team"
  ON public.exercicios
  FOR UPDATE
  USING (public.can_access_team(equipe_id))
  WITH CHECK (public.can_access_team(equipe_id));


-- Permite leitura via SDK para os avatares
CREATE POLICY "avatares: select public" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatares');

-- Permite leitura via SDK para as mídias de exercícios
CREATE POLICY "exercicio-media: select public" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'exercicio-media');
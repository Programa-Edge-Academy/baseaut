-- ==============================================================================
-- RLS POLICIES: Liberação de Sessões para Coordenadores
-- ==============================================================================

-- 1. Permite que Coordenadores INICIEM uma sessão (INSERT)
CREATE POLICY "sessoes: coordinator insert" 
ON "public"."sessoes" 
AS PERMISSIVE FOR INSERT 
TO public 
WITH CHECK (
    -- O usuário logado vai assinar como monitor_id da sessão
    (monitor_id = auth.uid()) 
    AND 
    -- Valida que o perfil dele é de fato um coordenador
    ((SELECT p.role FROM profiles p WHERE p.id = auth.uid()) = 'coordenador'::tipo_perfil) 
    AND 
    -- Valida que ele coordena a equipe do aluno em questão
    (EXISTS (
        SELECT 1 FROM alunos a 
        WHERE a.id = sessoes.aluno_id AND is_team_coordinator(a.equipe_id)
    ))
);

-- 2. Permite que Coordenadores FINALIZEM/EDITEM suas próprias sessões (UPDATE)
CREATE POLICY "sessoes: coordinator update own" 
ON "public"."sessoes" 
AS PERMISSIVE FOR UPDATE 
TO public 
USING (
    -- Só pode editar se ele for o dono da sessão e for coordenador
    (monitor_id = auth.uid()) 
    AND 
    ((SELECT p.role FROM profiles p WHERE p.id = auth.uid()) = 'coordenador'::tipo_perfil)
)
WITH CHECK (
    (monitor_id = auth.uid()) 
    AND 
    ((SELECT p.role FROM profiles p WHERE p.id = auth.uid()) = 'coordenador'::tipo_perfil) 
    AND 
    (EXISTS (
        SELECT 1 FROM alunos a 
        WHERE a.id = sessoes.aluno_id AND is_team_coordinator(a.equipe_id)
    ))
);
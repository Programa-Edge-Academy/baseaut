-- ================================================================
-- 0.1. FUNÇÕES AUXILIARES DE RLS
--
-- Alteração: adicionadas duas funções SECURITY DEFINER para evitar:
--   a) repetição de subqueries sensíveis em várias policies;
--   b) dependência de SELECT visível em equipes dentro de policies de INSERT;
--   c) risco de recursão ao consultar membros_equipe dentro da própria policy.
--
-- Motivo de negócio: o Roadmap diferencia "ser membro ativo da equipe" de
-- "ser coordenador responsável pela equipe". A tabela equipes possui
-- coordenador_id, então a RLS deve validar essa propriedade diretamente.
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_team_coordinator(p_equipe_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.equipes e
    WHERE e.id = p_equipe_id
      AND e.coordenador_id = auth.uid()
  );
$$;

-- Justificativa: usada para escritas administrativas/clínicas.
-- Apenas o coordenador dono da equipe pode criar/alterar alunos, avaliações,
-- membros e relatórios daquela equipe.

CREATE OR REPLACE FUNCTION public.can_access_team(p_equipe_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_team_member(p_equipe_id)
      OR public.is_team_coordinator(p_equipe_id);
$$;

-- Justificativa: usada para leitura de dados da equipe.
-- Cobre tanto monitores/membros ativos quanto o coordenador responsável,
-- mesmo que em algum ambiente o coordenador não tenha sido inserido também
-- em membros_equipe.

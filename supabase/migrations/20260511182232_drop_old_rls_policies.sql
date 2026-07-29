-- ================================================================
-- DROP DE POLICIES ANTIGAS / OBSOLETAS
-- ================================================================
-- Remove apenas as policies criadas pelos arquivos:
--   - 20260507160944_rls_policies.sql
--   - 20260507201718_rls_policies_operations.sql
--
-- Não remove:
--   - tabelas;
--   - dados;
--   - funções;
--   - RLS habilitado.
--
-- Deve rodar depois do enable_rls e antes das novas policies finais.
-- ================================================================


-- ================================================================
-- 1. POLICIES DO ARQUIVO:
--    20260507160944_rls_policies.sql
-- ================================================================

-- PROFILES
DROP POLICY IF EXISTS "profiles: select own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;

-- EQUIPES
DROP POLICY IF EXISTS "equipes: select member" ON public.equipes;
DROP POLICY IF EXISTS "equipes: insert coordinator" ON public.equipes;
DROP POLICY IF EXISTS "equipes: update coordinator" ON public.equipes;

-- MEMBROS_EQUIPE
DROP POLICY IF EXISTS "membros: select same team" ON public.membros_equipe;
DROP POLICY IF EXISTS "membros: manage coordinator" ON public.membros_equipe;


-- ================================================================
-- 2. POLICIES DO ARQUIVO:
--    20260507201718_rls_policies_operations.sql
-- ================================================================

-- ALUNOS
DROP POLICY IF EXISTS "alunos_select_team_member" ON public.alunos;
DROP POLICY IF EXISTS "alunos_insert_coordinator" ON public.alunos;
DROP POLICY IF EXISTS "alunos_update_coordinator" ON public.alunos;

-- EXERCICIOS
DROP POLICY IF EXISTS "exercicios_select_team" ON public.exercicios;
DROP POLICY IF EXISTS "exercicios_write_team" ON public.exercicios;

-- CIRCUITOS
DROP POLICY IF EXISTS "circuitos_select_team" ON public.circuitos;
DROP POLICY IF EXISTS "circuitos_write_team" ON public.circuitos;

-- SESSOES
DROP POLICY IF EXISTS "sessoes_monitor_select_own" ON public.sessoes;
DROP POLICY IF EXISTS "sessoes_coordinator_select_all" ON public.sessoes;
DROP POLICY IF EXISTS "sessoes_monitor_insert" ON public.sessoes;
DROP POLICY IF EXISTS "sessoes_monitor_update_own" ON public.sessoes;


-- ================================================================
-- FIM
-- ================================================================
-- Migration: Permite que coordenadores leiam os perfis dos membros de suas equipes
CREATE POLICY "coordenadores_leem_perfis_da_equipe"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT me.usuario_id
    FROM public.membros_equipe me
    INNER JOIN public.equipes eq ON eq.id = me.equipe_id
    WHERE eq.coordenador_id = auth.uid()
  )
);
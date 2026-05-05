-- 20260501_000017_create_sessoes.sql
CREATE TABLE public.sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  monitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  circuito_id UUID REFERENCES public.circuitos(id) ON DELETE SET NULL,
  formulario_id UUID REFERENCES public.formularios(id) ON DELETE SET NULL,
  status status_sessao NOT NULL DEFAULT 'em_andamento',
  data_agendada TIMESTAMPTZ,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  observacoes_gerais TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
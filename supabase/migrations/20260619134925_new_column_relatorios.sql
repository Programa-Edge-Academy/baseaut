ALTER TABLE public.relatorios
  ADD COLUMN IF NOT EXISTS snapshot_aluno JSONB;
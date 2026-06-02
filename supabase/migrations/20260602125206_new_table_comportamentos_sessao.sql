-- Pré-requisito para o Épico 10.4. Modelada aqui pois a tabela precisa existir antes da View do Épico 17
CREATE TABLE IF NOT EXISTS comportamentos_sessao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  -- execucao_id nullable: comportamento pode ser no nivel da sessão inteira
  execucao_id UUID REFERENCES execucoes_exercicio(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('estereotipia', 'contato_visual', 'engajamento', 'fuga', 'crise', 'outro')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_comportamentos_sessao_id ON comportamentos_sessao(sessao_id);
CREATE INDEX IF NOT EXISTS idx_comportamentos_tipo ON comportamentos_sessao(tipo);
CREATE INDEX IF NOT EXISTS idx_comportamentos_created ON comportamentos_sessao(created_at DESC);

-- RLS: membros da equipe leem e inserem
ALTER TABLE public.comportamentos_sessao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comportamentos_equipe"
  ON public.comportamentos_sessao FOR ALL
  USING (
    public.is_team_member(
      (SELECT equipe_id FROM public.sessoes WHERE id = sessao_id)
    )
  );
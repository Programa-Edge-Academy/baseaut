-- ════════════════════════════════════════════════════════════════════
-- Imagem do aluno vinculada a relatórios (snapshot com união de períodos)
-- ════════════════════════════════════════════════════════════════════
-- Ao criar um relatório, a imagem atual do aluno é copiada no storage e
-- registrada aqui com o período do relatório. Relatórios cujo início OU
-- fim caiam dentro do período coberto reutilizam a mesma imagem, e o
-- período coberto passa a ser a UNIÃO dos períodos dos relatórios que a
-- utilizam. Quando um relatório é removido o período é recalculado; se o
-- último relatório que usava a imagem for removido, a imagem é apagada
-- (linha e objeto no storage) para não acumular arquivos órfãos.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE public.relatorio_imagens_aluno (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id       UUID        NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  url            TEXT        NOT NULL,
  -- Caminho do objeto dentro do bucket 'avatares'; NULL quando a imagem
  -- original não pertencia ao bucket (nesse caso apenas a URL é guardada).
  storage_path   TEXT,
  periodo_inicio DATE        NOT NULL,
  periodo_fim    DATE        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_relatorio_imagens_aluno_aluno
  ON public.relatorio_imagens_aluno (aluno_id, periodo_inicio, periodo_fim);

ALTER TABLE public.relatorios
  ADD COLUMN imagem_id UUID REFERENCES public.relatorio_imagens_aluno(id) ON DELETE SET NULL;

CREATE INDEX idx_relatorios_imagem ON public.relatorios (imagem_id);

ALTER TABLE public.relatorio_imagens_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relatorio_imagens_aluno: acesso da equipe"
  ON public.relatorio_imagens_aluno
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos a
      WHERE a.id = aluno_id AND public.can_access_team(a.equipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alunos a
      WHERE a.id = aluno_id AND public.can_access_team(a.equipe_id)
    )
  );

-- O fluxo de limpeza remove a cópia da imagem quando o último relatório
-- que a utiliza é excluído; o bucket até então só possuía política de
-- INSERT para usuários autenticados.
CREATE POLICY "avatares: delete auth" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatares');

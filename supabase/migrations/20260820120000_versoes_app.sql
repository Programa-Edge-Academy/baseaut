-- ════════════════════════════════════════════════════════════════════
-- Versões do app: bloqueio de versão desatualizada e novidades da versão
-- ════════════════════════════════════════════════════════════════════
-- O app é distribuído por APK numa pasta do Google Drive, fora de qualquer
-- loja de aplicativos. Não existe, portanto, atualização automática nem aviso
-- do sistema: um usuário pode passar meses numa versão antiga sem perceber,
-- reportando como bug algo que já foi corrigido (é o que a coluna
-- feedbacks.app_version vinha revelando).
--
-- Esta tabela é o catálogo de versões publicadas. O app lê a mais recente ao
-- abrir e, se a versão instalada for anterior, bloqueia o uso até que o
-- usuário atualize. Também é daqui que sai a lista de alterações mostrada na
-- primeira abertura de cada versão nova.
--
-- LEITURA PÚBLICA (inclusive anônima): o bloqueio precisa valer já na tela de
-- login, antes de existir sessão. O conteúdo é só número de versão, notas de
-- lançamento e um link público do Drive — nada sensível. Escrita é exclusiva
-- da equipe, pelo painel do Supabase.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE public.versoes_app (
  -- Espelha exatamente o "version" de app.json ("maior.menor.correção").
  versao TEXT PRIMARY KEY CHECK (versao ~ '^\d+\.\d+\.\d+$'),
  -- Alterações da versão, uma por item, na ordem em que devem ser exibidas.
  notas TEXT[] NOT NULL DEFAULT '{}',
  -- Pasta do Google Drive de onde o usuário baixa o APK. Fica no banco, e não
  -- no código, porque quem está bloqueado roda uma versão antiga: um link
  -- embutido no app não teria como ser corrigido depois que a pasta mudasse.
  url_download TEXT,
  data_lancamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Convenção de soft delete do projeto: uma versão retirada de circulação
  -- deixa de contar como a mais recente, sem sumir do histórico.
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE public.versoes_app IS
  'Catálogo de versões publicadas do app. Define a versão mínima exigida e as notas de lançamento exibidas na primeira abertura de cada versão.';

CREATE INDEX idx_versoes_app_lancamento ON public.versoes_app (data_lancamento DESC);

-- ── RLS: leitura para todos; escrita só pela equipe (service role) ───────────
ALTER TABLE public.versoes_app ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versoes_app: leitura pública"
  ON public.versoes_app
  FOR SELECT
  USING (TRUE);

-- O papel anônimo precisa do privilégio explícito porque a checagem roda antes
-- do login. Sem SELECT, a policy acima nunca chega a ser avaliada.
GRANT SELECT ON public.versoes_app TO anon, authenticated;

-- ── Versão corrente ──────────────────────────────────────────────────────────
-- url_download entra nula de propósito: o link da pasta é preenchido pela
-- equipe no painel, junto com a publicação do APK. Enquanto estiver nulo o app
-- ainda avisa que há versão nova, mas não oferece o botão de download.
INSERT INTO public.versoes_app (versao, notas) VALUES (
  '1.1.3',
  ARRAY[
    'Aviso de atualização: o app passa a avisar quando existe uma versão mais nova e leva direto à pasta de download.',
    'Novidades da versão: na primeira vez que você abre uma versão nova, o app mostra o que mudou.',
    'O nível de suporte do TEA agora aceita "Indefinido", para criança ainda sem laudo.',
    'Correção no preenchimento do ATA: os indicadores marcados passam a ser gravados corretamente.'
  ]
);

-- ── Ritual de release ────────────────────────────────────────────────────────
-- A cada versão publicada, a equipe insere uma linha pela Table Editor:
--
--   INSERT INTO public.versoes_app (versao, notas, url_download)
--   VALUES ('1.1.4', ARRAY['Primeira alteração.', 'Segunda alteração.'],
--           'https://drive.google.com/drive/folders/...');
--
-- A linha só deve ser inserida depois que o APK correspondente estiver na
-- pasta do Drive: a partir dela, todo usuário em versão anterior fica
-- bloqueado.

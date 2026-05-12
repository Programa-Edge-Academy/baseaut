-- ================================================================
-- 1. PROFILES
-- Regra: cada usuário vê e edita apenas o próprio perfil.
-- Coordenador NÃO tem acesso privilegiado ao perfil de outros usuários.
-- ================================================================

CREATE POLICY "profiles: select own"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Justificativa: o perfil contém dados pessoais. O Roadmap não exige que
-- Coordenador leia profiles diretamente; quando necessário, a equipe deve ser
-- consultada por membros_equipe e dados agregados do app.

CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Justificativa: apenas o próprio usuário altera dados pessoais como nome,
-- telefone e avatar. Mudança de role/status_conta deve ser controlada fora
-- do app comum, preferencialmente por trigger/função administrativa.

-- ================================================================
-- 2. PREFERENCIAS_USUARIO
-- Regra: cada usuário gerencia apenas as próprias preferências.
-- ================================================================

CREATE POLICY "preferencias: own"
  ON public.preferencias_usuario
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Justificativa: preferências são pessoais e não fazem parte da governança
-- de equipe. Nenhum outro ator deve lê-las ou alterá-las.

-- ================================================================
-- 3. PERMISSOES / PERFIL_PERMISSOES / ITENS_MENU
-- Regra: catálogo de leitura para usuários autenticados; sem escrita via app.
-- ================================================================

CREATE POLICY "permissoes: read authenticated"
  ON public.permissoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "perfil_permissoes: read authenticated"
  ON public.perfil_permissoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "itens_menu: read authenticated"
  ON public.itens_menu
  FOR SELECT
  TO authenticated
  USING (true);

-- Justificativa: permissões e menus são seeds/configurações do sistema.
-- O front-end pode ler para renderizar navegação, mas alterações devem vir
-- apenas de migrations/DBA.

-- ================================================================
-- 4. SOLICITACOES_RECUPERACAO
-- Regra: cada usuário acessa apenas as próprias solicitações.
-- ================================================================

CREATE POLICY "recuperacao: own"
  ON public.solicitacoes_recuperacao
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Justificativa: contém codigo_hash e fluxo sensível de recuperação.
-- Nem Coordenador deve ler ou alterar recuperação de senha de outro usuário.

-- ================================================================
-- 7. NOTIFICACOES
-- Regra: cada usuário gerencia apenas as próprias notificações.
-- ================================================================

CREATE POLICY "notificacoes: own"
  ON public.notificacoes
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Justificativa: notificações são caixa de entrada individual do app.
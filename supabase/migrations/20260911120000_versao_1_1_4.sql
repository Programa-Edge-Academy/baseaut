-- ════════════════════════════════════════════════════════════════════
-- Publicação da versão 1.1.4
-- ════════════════════════════════════════════════════════════════════
-- Acrescenta a 1.1.4 ao catálogo de versões. A partir do momento em que esta
-- linha existe, ela passa a ser a versão mais recente, e o app faz duas coisas:
--
--   1. bloqueia quem estiver em versão anterior, oferecendo o botão que leva à
--      pasta do Drive (é daqui que sai o link do botão, sempre da linha mais
--      nova do catálogo);
--   2. mostra as notas abaixo na primeira abertura de quem já está na 1.1.4.
--
-- ATENÇÃO AO MOMENTO DO MERGE: no instante em que esta migration alcançar o
-- banco de produção, todo usuário em versão anterior fica travado até baixar a
-- 1.1.4. Ela só deve chegar lá depois que o APK correspondente já estiver na
-- pasta do Drive — caso contrário o bloqueio aponta para uma pasta sem o APK.
--
-- Idempotente de propósito (ON CONFLICT): se alguém já tiver inserido a linha
-- à mão pelo painel, a migration normaliza o conteúdo em vez de falhar e
-- derrubar o deploy.
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.versoes_app (versao, notas, url_download) VALUES (
  '1.1.4',
  ARRAY[
    'Cronômetro em segundo plano: o tempo da sessão e do exercício continua sendo contado quando o aplicativo fica em segundo plano ou a tela do aparelho é bloqueada.',
    'Feedback por e-mail: o botão de enviar feedback agora abre o seu aplicativo de e-mail, com a mensagem já endereçada à equipe de suporte.',
    'Correção no Registro de Controle pendente: ao abri-lo pelo aviso que aparece ao iniciar uma sessão, o formulário volta a mostrar o tempo da sessão e o que já havia sido preenchido, e o salvamento deixa de falhar.'
  ],
  'https://drive.google.com/drive/folders/1_iXQFKsQVPTibTUu17NtZRLb12Ul8vrn?usp=drive_link'
)
ON CONFLICT (versao) DO UPDATE SET
  notas        = EXCLUDED.notas,
  url_download = EXCLUDED.url_download,
  ativo        = TRUE;

-- ── Normaliza o link da 1.1.3 ────────────────────────────────────────────────
-- A 1.1.3 foi semeada com url_download nulo e, em pelo menos um ambiente, o
-- campo foi preenchido à mão com a forma "/drive/u/0/folders/...". Esse formato
-- é preso à conta Google que estiver em primeiro lugar na sessão do navegador:
-- quem tiver outra conta ativa cai em contexto errado ou recebe erro de acesso.
-- A forma de compartilhamento abaixo é a que funciona para qualquer pessoa com
-- o link. Só toca a linha da 1.1.3 e não altera nenhum histórico clínico.
UPDATE public.versoes_app
SET url_download = 'https://drive.google.com/drive/folders/1_iXQFKsQVPTibTUu17NtZRLb12Ul8vrn?usp=drive_link'
WHERE versao = '1.1.3';

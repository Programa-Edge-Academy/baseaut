-- Publicação da versão 1.1.5. Só mesclar na main depois que o APK estiver no Drive.
INSERT INTO public.versoes_app (versao, notas, url_download) VALUES (
  '1.1.5',
  ARRAY[
    'Modo sem internet: agora você pode iniciar e registrar sessões mesmo sem conexão. Alunos, circuitos e exercícios já abertos antes ficam disponíveis no aparelho.',
    'Envio automático: os registros feitos sem internet ficam guardados no aparelho e são enviados sozinhos quando a conexão voltar. Uma faixa no topo da tela mostra quantos ainda aguardam envio.',
    'Mais estabilidade com internet fraca: o app não perde mais registros quando a conexão cai no meio da sessão.',
    'Ao atualizar o app, instale a nova versão por cima da atual. Não desinstale, ou os registros ainda não enviados serão perdidos.'
  ],
  'https://drive.google.com/drive/folders/1_iXQFKsQVPTibTUu17NtZRLb12Ul8vrn?usp=drive_link'
)
ON CONFLICT (versao) DO UPDATE SET
  notas        = EXCLUDED.notas,
  url_download = EXCLUDED.url_download,
  ativo        = TRUE;
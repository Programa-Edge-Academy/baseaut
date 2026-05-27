-- Templates globais (ATA e CARS sem aluno) não pertencem a uma equipe específica
ALTER TABLE public.formularios
  ALTER COLUMN equipe_id DROP NOT NULL;

-- Garantir consistência: formulário deve ter equipe OU ser template global
ALTER TABLE public.formularios
  ADD CONSTRAINT formularios_equipe_ou_template CHECK (
    equipe_id IS NOT NULL          -- formulário normal de equipe
    OR aluno_id IS NULL            -- OU é template global (sem aluno vinculado)
  );

-- Tornar protegido false por padrão, para os formulários RC
ALTER TABLE public.formularios ALTER COLUMN protegido SET DEFAULT false;

-- CARS: 15 domínios × (1 escala + 1 observação) = 30 perguntas
DO $$
DECLARE
  v_id UUID := '00000000-0000-4ca5-0000-000000000ca5';
BEGIN

  INSERT INTO public.formularios
    (id, titulo, descricao, tipo, equipe_id, aluno_id, protegido, ativo)
  VALUES (
    v_id,
    'CARS — Childhood Autism Rating Scale',
    'Escala de Cotação do Autismo Infantil. 15 domínios, pontuação 1–4. Aplicadora: PEFaut/UFAL.',
    'cars',
    NULL,   -- template global, sem equipe
    NULL,   -- sem aluno (template)
    true,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.perguntas
    (formulario_id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem, protegida)
  VALUES
    (v_id, 'I — Relação com pessoas',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  1,  true),
    (v_id, 'I — Observações',
      'texto_opcional', NULL, false, 2,  true),

    (v_id, 'II — Imitação',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  3,  true),
    (v_id, 'II — Observações',
      'texto_opcional', NULL, false, 4,  true),

    (v_id, 'III — Resposta emocional',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  5,  true),
    (v_id, 'III — Observações',
      'texto_opcional', NULL, false, 6,  true),

    (v_id, 'IV — Uso corporal',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  7,  true),
    (v_id, 'IV — Observações',
      'texto_opcional', NULL, false, 8,  true),

    (v_id, 'V — Uso de objectos',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  9,  true),
    (v_id, 'V — Observações',
      'texto_opcional', NULL, false, 10, true),

    (v_id, 'VI — Adaptação à mudança',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  11, true),
    (v_id, 'VI — Observações',
      'texto_opcional', NULL, false, 12, true),

    (v_id, 'VII — Resposta visual',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  13, true),
    (v_id, 'VII — Observações',
      'texto_opcional', NULL, false, 14, true),

    (v_id, 'VIII — Resposta auditiva ao som',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  15, true),
    (v_id, 'VIII — Observações',
      'texto_opcional', NULL, false, 16, true),

    (v_id, 'IX — Resposta ao paladar, olfacto e tacto',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  17, true),
    (v_id, 'IX — Observações',
      'texto_opcional', NULL, false, 18, true),

    (v_id, 'X — Medo ou ansiedade',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  19, true),
    (v_id, 'X — Observações',
      'texto_opcional', NULL, false, 20, true),

    (v_id, 'XI — Comunicação verbal',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  21, true),
    (v_id, 'XI — Observações',
      'texto_opcional', NULL, false, 22, true),

    (v_id, 'XII — Comunicação não verbal',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  23, true),
    (v_id, 'XII — Observações',
      'texto_opcional', NULL, false, 24, true),

    (v_id, 'XIII — Nível de actividade',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  25, true),
    (v_id, 'XIII — Observações',
      'texto_opcional', NULL, false, 26, true),

    (v_id, 'XIV — Nível e consistência da resposta intelectual',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  27, true),
    (v_id, 'XIV — Observações',
      'texto_opcional', NULL, false, 28, true),

    (v_id, 'XV — Impressão global',
      'escala_decimal', '{"valores":[1,1.5,2,2.5,3,3.5,4]}'::jsonb, true,  29, true),
    (v_id, 'XV — Observações',
      'texto_opcional', NULL, false, 30, true)

  ON CONFLICT DO NOTHING;

END $$;
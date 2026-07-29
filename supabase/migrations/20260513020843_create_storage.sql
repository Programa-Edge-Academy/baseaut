-- 20260501_000028_create_storage.sql


-- Bucket público: avatares de usuários e alunos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatares', 'avatares', true);


-- Bucket público: mídias de exercícios (fotos demonstrativas)
INSERT INTO storage.buckets (id, name, public) VALUES ('exercicio-media', 'exercicio-media', true);

-- Políticas de upload: apenas usuários autenticados
CREATE POLICY "avatares: upload auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatares');


CREATE POLICY "exercicio-media: upload auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exercicio-media');

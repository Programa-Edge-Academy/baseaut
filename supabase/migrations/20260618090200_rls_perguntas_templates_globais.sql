-- ════════════════════════════════════════════════════════════════════
-- Leitura das perguntas dos TEMPLATES globais (ATA, CARS, RC, ...)
-- ════════════════════════════════════════════════════════════════════
-- Problema: a policy "perguntas: via formulario" só concede SELECT quando
-- can_access_team(formulario.equipe_id) é verdadeiro. Os templates globais têm
-- equipe_id = NULL (e aluno_id = NULL), então can_access_team(NULL) = false e
-- nenhum usuário consegue ler as perguntas do template.
--
-- No modelo de instância por registro (no-clone), a instância NÃO copia as
-- perguntas — ela aponta para o template via template_origem_id, e o cliente
-- precisa ler as perguntas do template. Resultado atual: "Nenhuma pergunta
-- encontrada" ao abrir ATA/CARS/RC.
--
-- Correção: policy ADITIVA somente de leitura, liberando as perguntas cujo
-- formulário-pai é um template (aluno_id IS NULL). Espelha a exceção que a
-- policy de SELECT de "formularios" já possui. As gravações continuam
-- protegidas pelas policies existentes ("perguntas: bloquear update/delete/
-- insert em protegido").
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "perguntas: select templates globais" ON public.perguntas;
CREATE POLICY "perguntas: select templates globais"
  ON public.perguntas
  FOR SELECT
  USING (
    formulario_id IN (
      SELECT f.id FROM public.formularios f WHERE f.aluno_id IS NULL
    )
  );

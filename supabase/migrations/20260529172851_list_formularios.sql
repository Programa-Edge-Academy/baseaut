-- ════════════════════════════════════════════════════════════════════
-- Índice de apoio para a RPC listar_formularios_aluno
-- ════════════════════════════════════════════════════════════════════
-- Otimiza o LEFT JOIN com respostas_formulario usando exatamente as
-- colunas usadas no vínculo: aluno_id + formulario_id.
--
-- O campo atualizado_em entra no índice para acelerar o MAX(atualizado_em),
-- e o id fica como INCLUDE para permitir que COUNT(rf.id) seja resolvido
-- pelo próprio índice quando o planner puder usar index-only scan.
CREATE INDEX IF NOT EXISTS idx_respostas_formulario_aluno_formulario_atualizado
  ON public.respostas_formulario (aluno_id, formulario_id, atualizado_em DESC)
  INCLUDE (id);

-- ════════════════════════════════════════════════════════════════════
-- RPC: listar_formularios_aluno
-- ════════════════════════════════════════════════════════════════════
-- Objetivo: retornar a lista de formulários ATA e CARS vinculados a um
-- aluno específico, com a flag `tem_respostas` calculada na mesma
-- consulta principal (sem round-trip extra ao banco).
--
-- Critérios atendidos:
--   ✓ Passo 1 — Otimização de Busca:
--       COUNT(rf.id) > 0 resolve `tem_respostas` matematicamente no
--       mesmo SELECT; zero consultas adicionais para checar existência.
--
--   ✓ Passo 2 — Ordenação Temporal:
--       ORDER BY f.tipo ASC, f.created_at DESC garante agrupamento
--       por tipo ('ata' antes de 'cars') e data decrescente dentro
--       de cada grupo.
--
--   ✓ Passo 3 — Eficiência de Memória:
--       STABLE instrui o planner a tratar a função como somente-leitura
--       estável por transação, habilitando cache de resultado e evitando
--       custo de rastreamento de escrita.
--
-- Tabelas acessadas (somente leitura):
--   • public.formularios           — fonte principal
--   • public.respostas_formulario  — LEFT JOIN via aluno_id + formulario_id
--
-- Agregações:
--   • COUNT(rf.id)       → total_respostas  (e flag tem_respostas)
--   • MAX(rf.atualizado_em) → ultima_resposta_em
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.listar_formularios_aluno(
  p_aluno_id UUID
)
RETURNS TABLE (
  id                UUID,
  titulo            TEXT,
  tipo              tipo_formulario,
  ativo             BOOLEAN,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ,
  tem_respostas     BOOLEAN,
  total_respostas   BIGINT,
  ultima_resposta_em TIMESTAMPTZ
)
LANGUAGE sql
-- ── Passo 3: marca a função como estável (somente leitura).
-- O banco de dados sabe que não haverá escrita e pode criar cache
-- de resultado dentro da mesma transação.
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.titulo,
    f.tipo,
    f.ativo,
    f.created_at,
    f.updated_at,

    -- ── Passo 1: determina `tem_respostas` matematicamente.
    -- COUNT(rf.id) retorna 0 quando nenhuma resposta existe (LEFT JOIN)
    -- ou N > 0 quando há registros. A comparação > 0 evita qualquer
    -- consulta separada para checar existência.
    COUNT(rf.id) > 0             AS tem_respostas,
    COUNT(rf.id)                 AS total_respostas,
    MAX(rf.atualizado_em)        AS ultima_resposta_em

  FROM public.formularios f

  -- LEFT JOIN garante que formulários sem nenhuma resposta ainda
  -- aparecem na lista (tem_respostas = false, total_respostas = 0).
  -- O vínculo é feito por aluno_id + formulario_id para restringir
  -- o agregado exatamente ao aluno solicitado.
  LEFT JOIN public.respostas_formulario rf
         ON rf.aluno_id      = p_aluno_id
        AND rf.formulario_id = f.id

  WHERE f.aluno_id = p_aluno_id
    AND f.tipo IN ('ata', 'cars')   -- filtra apenas os tipos requeridos

  -- GROUP BY necessário para que COUNT e MAX operem por formulário
  GROUP BY
    f.id,
    f.titulo,
    f.tipo,
    f.ativo,
    f.created_at,
    f.updated_at

  -- ── Passo 2: ordenação temporal.
  -- Primeiro agrupa por tipo (ordem alfabética coloca 'ata' antes de
  -- 'cars'), depois ordena por data de criação decrescente dentro de
  -- cada grupo, expondo os registros mais recentes no topo.
  ORDER BY
    f.tipo       ASC,
    f.created_at DESC;
$$;
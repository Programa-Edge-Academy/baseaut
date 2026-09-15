import { supabase } from "@/lib/supabase";

/**
 * Estado de "guarda" ao iniciar uma nova sessão ou formulário para um aluno:
 * - inProgressSession: sessão em andamento (para continuar ou finalizar);
 * - pendingByType: para cada tipo de formulário (registro_controle, ata, cars,
 *   mabc2), o id de uma instância pendente (com obrigatória sem resposta);
 * - pendingRcSessionId: a sessão dona do Registro de Controle pendente.
 */
export type StartGuardState = {
  inProgressSession: {
    id: string;
    circuitoId: string | null;
    modoExecucao: string | null;
  } | null;
  pendingByType: Record<string, string>;
  /**
   * Sessão à qual o Registro de Controle pendente pertence, ou null quando não
   * há RC pendente. Diferente de ATA/CARS/MABC-2, que são do aluno, o RC é de
   * uma sessão: sem esse id a tela do formulário não carrega as respostas já
   * gravadas nem consegue gravar novas (respostas_formulario.sessao_id é
   * exigido pela RLS). O vínculo mora em sessoes.formulario_id.
   */
  pendingRcSessionId: string | null;
};

type FormRow = { id: string; tipo: string; pendente: boolean };

export async function getStartGuard(
  alunoId: string,
): Promise<StartGuardState> {
  const [{ data: sessao }, { data: formularios }] = await Promise.all([
    supabase
      .from("sessoes")
      .select("id, circuito_id(id, modo_execucao)")
      .eq("aluno_id", alunoId)
      .eq("status", "em_andamento")
      .order("data_inicio", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("listar_formularios_aluno", { p_aluno_id: alunoId }),
  ]);

  const pendingByType: Record<string, string> = {};
  for (const row of (formularios ?? []) as FormRow[]) {
    // Mantém a primeira instância pendente de cada tipo.
    if (row.pendente && !pendingByType[row.tipo]) pendingByType[row.tipo] = row.id;
  }

  // Só custa uma consulta quando existe RC pendente; o índice em
  // sessoes(formulario_id) atende a busca.
  let pendingRcSessionId: string | null = null;
  const rcFormularioId = pendingByType.registro_controle;
  if (rcFormularioId) {
    const { data: rcSessao } = await supabase
      .from("sessoes")
      .select("id")
      .eq("formulario_id", rcFormularioId)
      .limit(1)
      .maybeSingle();
    pendingRcSessionId = rcSessao?.id ?? null;
  }

  const circuito = sessao?.circuito_id as any;
  return {
    inProgressSession: sessao
      ? {
          id: sessao.id,
          circuitoId: circuito?.id ?? null,
          modoExecucao: circuito?.modo_execucao ?? null,
        }
      : null,
    pendingByType,
    pendingRcSessionId,
  };
}

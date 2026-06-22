import { supabase } from "@/lib/supabase";

/**
 * Estado de "guarda" ao iniciar uma nova sessão ou formulário para um aluno:
 * - inProgressSession: sessão em andamento (para continuar ou finalizar);
 * - pendingByType: para cada tipo de formulário (registro_controle, ata, cars,
 *   mabc2), o id de uma instância pendente (com obrigatória sem resposta).
 */
export type StartGuardState = {
  inProgressSession: {
    id: string;
    circuitoId: string | null;
    modoExecucao: string | null;
  } | null;
  pendingByType: Record<string, string>;
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
  };
}

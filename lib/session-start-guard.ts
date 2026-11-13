import { cachedRead, readCache } from "@/lib/offline/cache";
import { isNetworkError } from "@/lib/offline/errors";
import { listOutbox } from "@/lib/offline/outbox";
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

/** With a saved copy, how long a tap on a circuit waits for the server answer. */
const GUARD_MAX_WAIT_MS = 1500;

/**
 * Reads what blocks a new session or form for a student: a session in
 * progress and the pending forms of each type.
 *
 * @remarks
 * The server answer is kept on the device (`start-guard:<alunoId>`), so offline
 * the warnings still appear without waiting for the network, and sessions
 * started or finished on this device but not sent yet are taken into account
 * from the outbox. Offline, a session started on another device after the last
 * online read is not seen.
 */
export async function getStartGuard(
  alunoId: string,
): Promise<StartGuardState> {
  const empty: StartGuardState = {
    inProgressSession: null,
    pendingByType: {},
    pendingRcSessionId: null,
  };
  const fromServer = await cachedRead(
    `start-guard:${alunoId}`,
    () => fetchStartGuard(alunoId),
    { maxWaitMs: GUARD_MAX_WAIT_MS },
  ).catch(() => empty);
  return withQueuedSessions(alunoId, fromServer);
}

/** Reads the guard from Supabase; throws on a network failure so the saved copy is used. */
async function fetchStartGuard(alunoId: string): Promise<StartGuardState> {
  const [{ data: sessao, error: sessaoError }, { data: formularios, error: formsError }] =
    await Promise.all([
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
  if (isNetworkError(sessaoError)) throw sessaoError;
  if (isNetworkError(formsError)) throw formsError;

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
    const { data: rcSessao, error: rcError } = await supabase
      .from("sessoes")
      .select("id")
      .eq("formulario_id", rcFormularioId)
      .limit(1)
      .maybeSingle();
    if (isNetworkError(rcError)) throw rcError;
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

/**
 * Overlays the sessions still waiting in the outbox on the guard: a session
 * started on this device that has not reached Supabase yet still counts as in
 * progress, and one finished here no longer does.
 */
async function withQueuedSessions(
  alunoId: string,
  guard: StartGuardState,
): Promise<StartGuardState> {
  const items = await listOutbox().catch(() => []);
  const finished = new Set<string>();
  let started: { id: string; circuitoId: string | null; equipeId: string | null } | null = null;

  for (const { op } of items) {
    if (op.kind === "update" && op.table === "sessoes" && op.payload.status && op.payload.status !== "em_andamento") {
      finished.add(String(op.match.id));
    }
    if (op.kind === "insert" && op.table === "sessoes" && !Array.isArray(op.payload)) {
      const row = op.payload;
      if (row.aluno_id === alunoId && row.status === "em_andamento") {
        started = {
          id: String(row.id),
          circuitoId: (row.circuito_id as string | null) ?? null,
          equipeId: (row.equipe_id as string | null) ?? null,
        };
      }
    }
  }

  let inProgressSession = guard.inProgressSession;
  if (inProgressSession && finished.has(inProgressSession.id)) inProgressSession = null;
  if (started && !finished.has(started.id)) {
    const circuits = started.equipeId
      ? await readCache<any[]>(`circuitos:${started.equipeId}`).catch(() => undefined)
      : undefined;
    const circuit = circuits?.find((c) => c.id === started!.circuitoId);
    inProgressSession = {
      id: started.id,
      circuitoId: started.circuitoId,
      modoExecucao: circuit?.modo_execucao ?? null,
    };
  }
  return { ...guard, inProgressSession };
}

import { supabase } from "@/lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { getCurrentUser } from "./auth";
import { clearCache, readCache } from "./cache";
import { isNetworkError } from "./errors";
import { isOnline } from "./require-online";
import { rcDraftKey } from "./session-form";
import {
    countOutbox,
    enqueue,
    listOutbox,
    markAttempt,
    moveToFailed,
    removeFromOutbox,
    type OutboxItem,
    type OutboxOp,
} from "./outbox";

/** Runs one queued write against Supabase; throws the Supabase error on failure. */
async function runOp(item: OutboxItem): Promise<void> {
  const { op } = item;
  let result: { error: any };
  if (op.kind === "sessionFormAnswers") {
    await sendSessionFormAnswers(op.sessaoId, op.rows);
    return;
  } else if (op.kind === "rpc") {
    result = await supabase.rpc(op.fn, op.args);
  } else if (op.kind === "update") {
    result = await supabase.from(op.table).update(op.payload).match(op.match);
  } else if (op.kind === "upsert") {
    result = await supabase.from(op.table).upsert(op.payload, {
      onConflict: op.onConflict,
      ignoreDuplicates: op.ignoreDuplicates,
    });
  } else {
    result = await supabase.from(op.table).insert(op.payload);
    // The row's id is generated on the device: a duplicate key means an earlier
    // attempt already landed and only its response was lost.
    if (result.error?.code === "23505") return;
  }
  if (result.error) throw result.error;
}

/**
 * Sends a session's Control Record answers to the form instance the database
 * created for it, then syncs the behaviours the answers describe.
 */
async function sendSessionFormAnswers(
  sessaoId: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  const { data, error } = await supabase
    .from("sessoes")
    .select("formulario_id")
    .eq("id", sessaoId)
    .maybeSingle();
  if (error) throw error;
  // A circuit without a Control Record has nothing to attach the answers to.
  if (!data?.formulario_id) return;

  const { error: upsertError } = await supabase
    .from("respostas_formulario")
    .upsert(
      rows.map((row) => ({ ...row, formulario_id: data.formulario_id })),
      { onConflict: "sessao_id, pergunta_id" },
    );
  if (upsertError) throw upsertError;

  const { error: rpcError } = await supabase.rpc("sincronizar_comportamentos_rc", {
    p_sessao_id: sessaoId,
  });
  if (rpcError) throw rpcError;

  // Drop the local draft only if no newer save replaced it meanwhile.
  const draft = await readCache(rcDraftKey(sessaoId));
  if (JSON.stringify(draft) === JSON.stringify(rows)) {
    await clearCache(rcDraftKey(sessaoId));
  }
}

/** An expired token is retried after refresh, never treated as a rejected write. */
function isAuthError(err: any): boolean {
  return err?.code === "PGRST301" || /JWT/i.test(err?.message ?? "");
}

let flushing: Promise<number> | null = null;

/**
 * Sends the queued writes in order and returns how many are still pending.
 *
 * Stops at the first network or auth failure (later items may depend on the
 * one that failed, e.g. executions on their session), and moves writes that
 * Supabase rejects for good to the failed list so they do not block the rest.
 * Concurrent calls share the same run.
 */
export function flushOutbox(): Promise<number> {
  if (!flushing) {
    flushing = doFlush().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function doFlush(): Promise<number> {
  // Offline every attempt would fail and rewrite the queue for nothing.
  if (!(await isOnline())) return countOutbox();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return countOutbox();

  for (const item of await listOutbox()) {
    // Another account's writes wait for that account to log in again (RLS).
    if (item.userId !== session.user.id) continue;
    try {
      await runOp(item);
      await removeFromOutbox(item.id);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      if (isNetworkError(err) || isAuthError(err)) {
        await markAttempt(item.id, message);
        break;
      }
      await moveToFailed(item.id, message);
    }
  }
  return countOutbox();
}

/** Wait after a write before sending, so a burst of writes goes in one run. */
const WRITE_FLUSH_DELAY_MS = 1500;
/** Wait after the connection comes back, so the network settles first. */
const RECONNECT_FLUSH_DELAY_MS = 3000;

let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedules one flush after `delayMs`; calls made before it runs are folded
 * into it, so saving several records in a row sends the queue once.
 */
export function scheduleFlush(delayMs: number): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOutbox();
  }, delayMs);
}

/**
 * Flushes now, a few seconds after reconnecting and whenever the app returns
 * to the foreground. {@link doFlush} skips the attempt while offline.
 */
export function startOutboxSync(): () => void {
  void flushOutbox();
  let wasConnected: boolean | null = null;
  const offNet = NetInfo.addEventListener((state) => {
    const connected = state.isConnected !== false;
    if (connected && wasConnected === false) scheduleFlush(RECONNECT_FLUSH_DELAY_MS);
    wasConnected = connected;
  });
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") void flushOutbox();
  });
  return () => {
    offNet();
    appState.remove();
    if (flushTimer) clearTimeout(flushTimer);
  };
}

/**
 * Saves a write in the outbox for the logged-in user and schedules sending it
 * shortly after ({@link scheduleFlush}). Resolves once the write is safe on the
 * device, not when Supabase has it. Uses the login saved on the device, so it
 * also works offline with an expired token.
 */
export async function queueWrite(op: OutboxOp): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await enqueue(user.id, op);
  scheduleFlush(WRITE_FLUSH_DELAY_MS);
}

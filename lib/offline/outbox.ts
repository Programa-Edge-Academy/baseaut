import AsyncStorage from "@react-native-async-storage/async-storage";
import { newId } from "./ids";

/** One write waiting to reach Supabase, described as data so it survives restarts. */
export type OutboxOp =
  | {
      kind: "insert" | "upsert";
      table: string;
      payload: Record<string, unknown> | Record<string, unknown>[];
      onConflict?: string;
      ignoreDuplicates?: boolean;
    }
  | {
      kind: "update";
      table: string;
      payload: Record<string, unknown>;
      /** Columns that select the row, e.g. `{ id: sessaoId }`. */
      match: Record<string, unknown>;
    }
  | { kind: "rpc"; fn: string; args: Record<string, unknown> }
  | {
      /**
       * Control Record answers of a session. Their `formulario_id` is set when
       * sent, because the per-session form only exists once the session row
       * reached Supabase.
       */
      kind: "sessionFormAnswers";
      sessaoId: string;
      rows: Record<string, unknown>[];
    };

export type OutboxItem = {
  id: string;
  /** Who created it: RLS checks the logged-in user when it is sent. */
  userId: string;
  createdAt: string;
  op: OutboxOp;
  attempts: number;
  lastError?: string;
};

const QUEUE_KEY = "baseaut:outbox:v1";
const FAILED_KEY = "baseaut:outbox-failed:v1";

const listeners = new Set<() => void>();

// Every change is a read-modify-write on one AsyncStorage key; running them one
// at a time keeps two quick enqueues from overwriting each other.
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

async function read(key: string): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function write(key: string, items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}

/** Adds a write to the end of the queue. */
export function enqueue(userId: string, op: OutboxOp): Promise<OutboxItem> {
  return locked(async () => {
    const item: OutboxItem = {
      id: newId(),
      userId,
      createdAt: new Date().toISOString(),
      op,
      attempts: 0,
    };
    await write(QUEUE_KEY, [...(await read(QUEUE_KEY)), item]);
    return item;
  });
}

/** Pending writes, oldest first. */
export function listOutbox(): Promise<OutboxItem[]> {
  return read(QUEUE_KEY);
}

export async function countOutbox(): Promise<number> {
  return (await read(QUEUE_KEY)).length;
}

/** Drops an item once Supabase accepted it. */
/**
 * The session an outbox item belongs to, so several writes of one session can
 * be shown as one pending session. Items with no session count on their own.
 */
function sessionOf(item: OutboxItem): string {
  const { op } = item;
  if (op.kind === "sessionFormAnswers") return op.sessaoId;
  if (op.kind === "rpc") return item.id;
  if (op.table === "sessoes") {
    const id = op.kind === "update" ? op.match.id : (Array.isArray(op.payload) ? op.payload[0] : op.payload)?.id;
    return id ? String(id) : item.id;
  }
  const row = Array.isArray(op.payload) ? op.payload[0] : op.payload;
  return row?.sessao_id ? String(row.sessao_id) : item.id;
}

/** How many sessions still have writes waiting in the outbox. */
export async function countPendingSessions(): Promise<number> {
  return new Set((await read(QUEUE_KEY)).map(sessionOf)).size;
}

export function removeFromOutbox(id: string): Promise<void> {
  return locked(async () => {
    await write(QUEUE_KEY, (await read(QUEUE_KEY)).filter((i) => i.id !== id));
  });
}

/** Records a failed network attempt; the item stays in place to be retried. */
export function markAttempt(id: string, error: string): Promise<void> {
  return locked(async () => {
    const items = await read(QUEUE_KEY);
    await write(
      QUEUE_KEY,
      items.map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1, lastError: error } : i)),
    );
  });
}

/** Moves an item Supabase rejected for good (RLS, validation) out of the queue. */
export function moveToFailed(id: string, error: string): Promise<void> {
  return locked(async () => {
    const items = await read(QUEUE_KEY);
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await write(FAILED_KEY, [...(await read(FAILED_KEY)), { ...item, lastError: error }]);
    await write(QUEUE_KEY, items.filter((i) => i.id !== id));
  });
}

export function listFailed(): Promise<OutboxItem[]> {
  return read(FAILED_KEY);
}

/** Calls `listener` whenever the queue or the failed list changes. */
export function subscribeOutbox(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
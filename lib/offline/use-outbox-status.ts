import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { countPendingSessions, listFailed, subscribeOutbox } from "./outbox";

/** What the UI shows about the offline queue. */
export type OutboxStatus = {
  /** Sessions with writes saved on the device and not yet sent. */
  pending: number;
  /** Writes Supabase rejected for good (kept for inspection). */
  failed: number;
  /** False only when NetInfo reports no connection; unknown counts as online. */
  online: boolean;
};

/**
 * Live view of the offline queue and the connection, for banners and counters.
 * Re-reads the counts whenever the queue changes.
 */
export function useOutboxStatus(): OutboxStatus {
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const [pendingCount, failedItems] = await Promise.all([countPendingSessions(), listFailed()]);
      if (!active) return;
      setPending(pendingCount);
      setFailed(failedItems.length);
    };

    void refresh();
    const offQueue = subscribeOutbox(() => void refresh());
    const offNet = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => {
      active = false;
      offQueue();
      offNet();
    };
  }, []);

  return { pending, failed, online };
}

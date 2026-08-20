import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "@baseaut/last-seen-version";

const VERSION_PATTERN = /^\d+(\.\d+)*$/;

/** A published release read from the `versoes_app` catalog. */
export type AppRelease = {
  /** Version string mirroring `version` in `app.json`. */
  versao: string;
  /** Changes introduced by this release, in display order. */
  notas: string[];
  /** Google Drive folder the APK is downloaded from, when already published. */
  url_download: string | null;
};

/** State returned by {@link useAppVersion}. */
type AppVersionState = {
  /** Version of the running build, or `null` when it cannot be read. */
  installedVersion: string | null;
  /** Newest published release, set only while an update is required. */
  requiredRelease: AppRelease | null;
  /** Release whose notes have not been shown on this device yet. */
  pendingRelease: AppRelease | null;
  /** Marks the installed version as seen and dismisses the notes. */
  acknowledgeRelease: () => void;
};

/**
 * Compares two dot-separated version strings.
 *
 * @returns A negative number when `a` precedes `b`, zero when they match, and a
 * positive number when `a` is newer.
 * @remarks Each segment is compared numerically rather than lexicographically,
 * so `1.1.10` correctly sorts after `1.1.9`.
 */
function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Checks the running build against the `versoes_app` catalog on mount, telling
 * the caller whether the app must be updated before it can be used and whether
 * the notes for the installed version still need to be shown.
 *
 * @remarks
 * Every failure path is deliberately permissive: an unreadable build version, a
 * network error, an empty catalog or a malformed version string all leave the
 * app unblocked. The check exists to nudge users off stale APKs — locking a
 * clinic out of an ongoing session because a request failed would be far worse
 * than letting an outdated build through.
 *
 * The catalog is read whole rather than filtered server-side: it holds one tiny
 * row per release, and the same rows answer both questions (which release is
 * newest, and what changed in the installed one).
 *
 * A required update takes precedence over the release notes, and the seen
 * marker is only written once the user acknowledges the notes — so a user who
 * is blocked still gets the notes after updating. A version that carries no
 * notes is marked as seen straight away, so it is not re-checked on every
 * launch for a dialog that would render empty.
 */
export function useAppVersion(): AppVersionState {
  const installedVersion = Constants.expoConfig?.version ?? null;
  const [requiredRelease, setRequiredRelease] = useState<AppRelease | null>(null);
  const [pendingRelease, setPendingRelease] = useState<AppRelease | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!installedVersion || !VERSION_PATTERN.test(installedVersion)) return;

      const { data, error } = await supabase
        .from("versoes_app")
        .select("versao, notas, url_download")
        .eq("ativo", true);

      if (cancelled || error || !data || data.length === 0) return;

      const releases = (data as AppRelease[])
        .filter((release) => VERSION_PATTERN.test(release.versao))
        .sort((a, b) => compareVersions(b.versao, a.versao));

      const latest = releases[0];
      if (!latest) return;

      if (compareVersions(installedVersion, latest.versao) < 0) {
        setRequiredRelease(latest);
        return;
      }

      const seenVersion = await AsyncStorage.getItem(STORAGE_KEY);
      if (cancelled || seenVersion === installedVersion) return;

      const current = releases.find(
        (release) => release.versao === installedVersion,
      );

      if (!current || current.notas.length === 0) {
        AsyncStorage.setItem(STORAGE_KEY, installedVersion);
        return;
      }

      setPendingRelease(current);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [installedVersion]);

  const acknowledgeRelease = useCallback(() => {
    setPendingRelease(null);
    if (installedVersion) {
      AsyncStorage.setItem(STORAGE_KEY, installedVersion);
    }
  }, [installedVersion]);

  return {
    installedVersion,
    requiredRelease,
    pendingRelease,
    acknowledgeRelease,
  };
}

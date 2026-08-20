import { ReleaseNotesModal } from "@/features/settings/components/release-notes-modal";
import { UpdateRequiredModal } from "@/features/settings/components/update-required-modal";
import { useAppVersion } from "@/features/settings/hooks/use-app-version";
import React from "react";

/**
 * Mounts the app-wide version dialogs: the blocking update notice when the
 * installed build is behind the newest published release, and the release notes
 * the first time the app opens on a version this device has not run before.
 *
 * @remarks
 * Lives at the root layout, above the navigation stack, so the block applies on
 * every route — including the login screen, since an outdated build must not be
 * usable at all. Renders nothing while the app is up to date, and never blocks
 * when the catalog cannot be read (see {@link useAppVersion}).
 */
export function AppVersionGate() {
  const {
    installedVersion,
    requiredRelease,
    pendingRelease,
    acknowledgeRelease,
  } = useAppVersion();

  if (installedVersion && requiredRelease) {
    return (
      <UpdateRequiredModal
        installedVersion={installedVersion}
        release={requiredRelease}
      />
    );
  }

  if (pendingRelease) {
    return (
      <ReleaseNotesModal
        release={pendingRelease}
        onAcknowledge={acknowledgeRelease}
      />
    );
  }

  return null;
}

import { createContext, useContext } from "react";

/** Identifies the surface (screen or modal) a tutorial target was registered on. */
export const ROOT_GUARD_SCOPE = "__root__";

const GuardScopeContext = createContext<string>(ROOT_GUARD_SCOPE);

/**
 * Provides the surface identity used to scope tutorial spotlight targets.
 *
 * @remarks
 * Every {@link file://../components/tutorial-tap-guard.tsx} mounts one, so a
 * target registered inside a modal is distinguishable from one registered on the
 * screen behind it. Without this, a modal that holds no tutorial target — a date
 * picker opened from a highlighted period selector, say — would measure the
 * target *behind* it, still find valid coordinates, and block its own content.
 */
export const GuardScopeProvider = GuardScopeContext.Provider;

/** Returns the surface the calling component renders on. */
export function useGuardScope(): string {
  return useContext(GuardScopeContext);
}

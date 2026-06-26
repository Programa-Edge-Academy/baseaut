import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { Toast, type ToastMode } from "@/components/toast";

/** Input accepted by {@link GlobalToastContextValue.showToast}. */
type ShowToastInput = {
  mode?: ToastMode;
  title: string;
  description?: string;
};

/** Value exposed by the global toast context. */
type GlobalToastContextValue = {
  showToast: (input: ShowToastInput) => void;
};

const GlobalToastContext = createContext<GlobalToastContextValue>({
  showToast: () => {},
});

/**
 * Global toast mounted at the root layout. Living above navigation, it lets a
 * screen trigger a message that remains visible after navigating to the next
 * screen (e.g. saving a form and navigating before the toast appears).
 */
export function GlobalToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    key: number;
    visible: boolean;
    mode: ToastMode;
    title: string;
    description?: string;
  }>({ key: 0, visible: false, mode: "success", title: "" });

  const showToast = useCallback((input: ShowToastInput) => {
    setState((prev) => ({
      key: prev.key + 1,
      visible: true,
      mode: input.mode ?? "success",
      title: input.title,
      description: input.description,
    }));
  }, []);

  return (
    <GlobalToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        key={state.key}
        visible={state.visible}
        mode={state.mode}
        title={state.title}
        description={state.description}
        onHide={() => setState((prev) => ({ ...prev, visible: false }))}
      />
    </GlobalToastContext.Provider>
  );
}

/** Returns the global toast controller from context. */
export function useGlobalToast() {
  return useContext(GlobalToastContext);
}

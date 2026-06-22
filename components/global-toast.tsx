import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { Toast, type ToastMode } from "@/components/toast";

type ShowToastInput = {
  mode?: ToastMode;
  title: string;
  description?: string;
};

type GlobalToastContextValue = {
  showToast: (input: ShowToastInput) => void;
};

const GlobalToastContext = createContext<GlobalToastContextValue>({
  showToast: () => {},
});

/**
 * Toast global montado no layout raiz. Como vive acima da navegação, permite
 * disparar uma mensagem em uma tela e exibi-la já na tela seguinte (ex.: salvar
 * um formulário e navegar antes do toast aparecer).
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
    // Incrementa a key para forçar reanimação mesmo em toasts consecutivos.
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

export function useGlobalToast() {
  return useContext(GlobalToastContext);
}

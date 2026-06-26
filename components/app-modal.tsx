import { Keyboard, Modal, ModalProps, Platform, TouchableWithoutFeedback, View } from "react-native";

/**
 * Modal wrapper that dismisses the keyboard on outside taps for native
 * platforms while keeping the plain modal behaviour on web. Accepts the same
 * props as React Native's {@link Modal}.
 */
export function AppModal({ children, ...props }: ModalProps & { children?: React.ReactNode }) {
  return (
    <Modal {...props}>
      {Platform.OS !== "web" ? (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </TouchableWithoutFeedback>
      ) : (
        <View style={{ flex: 1 }}>
          {children}
        </View>
       )
      }
    </Modal>
  );
}

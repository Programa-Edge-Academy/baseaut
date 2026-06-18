import { Keyboard, Modal, ModalProps, Platform, TouchableWithoutFeedback, View } from "react-native";

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

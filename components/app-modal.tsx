import { Keyboard, Modal, ModalProps, TouchableWithoutFeedback, View } from "react-native";

export function AppModal({ children, ...props }: ModalProps & { children?: React.ReactNode }) {
  return (
    <Modal {...props}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

import { Modal, ModalProps, View } from "react-native";

/**
 * Full-screen modal wrapper that forwards every prop to React Native's
 * {@link Modal}.
 *
 * @remarks
 * The content is intentionally not wrapped in a `TouchableWithoutFeedback`:
 * on native that view claims the touch responder and prevents inner
 * `ScrollView`s from receiving drag gestures (only `Pressable` children, which
 * yield the responder on move, would scroll). Keyboard dismissal is handled by
 * the modal's own scroll views instead.
 */
export function AppModal({ children, ...props }: ModalProps & { children?: React.ReactNode }) {
  return (
    <Modal {...props}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </Modal>
  );
}

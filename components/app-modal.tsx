import { TutorialTapGuard } from "@/features/tutorial/components/tutorial-tap-guard";
import { Modal, ModalProps, View } from "react-native";

/** Props for {@link AppModal}. */
export type AppModalProps = ModalProps & {
  children?: React.ReactNode;
  /**
   * Opts the content out of the tutorial tap guard, keeping it fully
   * interactive during a guided simulation. Reserved for the tutorial's own
   * surfaces (the practice notice), which must stay usable on every sub-step.
   */
  tutorialGuardExempt?: boolean;
};

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
 *
 * It also mounts a {@link TutorialTapGuard} around the content. A modal renders
 * in its own native hierarchy, so a guard mounted on the screen behind it cannot
 * see these touches — without this, every control inside every modal would stay
 * pressable during a guided tutorial. The guard is inert outside a simulation,
 * so this costs nothing in normal use.
 */
export function AppModal({
  children,
  tutorialGuardExempt = false,
  ...props
}: AppModalProps) {
  return (
    <Modal {...props}>
      <View style={{ flex: 1 }}>
        {tutorialGuardExempt ? (
          children
        ) : (
          <TutorialTapGuard>{children}</TutorialTapGuard>
        )}
      </View>
    </Modal>
  );
}

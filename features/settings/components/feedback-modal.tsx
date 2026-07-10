import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { useGlobalToast } from "@/components/global-toast";
import { RipplePressable } from "@/components/ripple-pressable";
import {
  FeedbackCategory,
  useFeedback,
} from "@/features/settings/hooks/use-feedback";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { withOpacity } from "@/components/color-opacity";
import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

/** Props for {@link FeedbackModal}. */
type FeedbackModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** Selectable feedback categories with their localized labels. */
const CATEGORIES: { id: FeedbackCategory; labelKey: TranslationKey }[] = [
  { id: "problema", labelKey: "feedback.category.problema" },
  { id: "sugestao", labelKey: "feedback.category.sugestao" },
  { id: "outro", labelKey: "feedback.category.outro" },
];

const MAX_LENGTH = 1000;

/**
 * Modal that lets the user send feedback (a problem or a suggestion) straight to
 * the development team via {@link useFeedback}. Shows a success toast and closes
 * on submit; the content is private and never surfaced to other users.
 */
export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const colors = useThemeColors();
  const { t } = useI18n();
  const { showToast } = useGlobalToast();
  const { sendFeedback, loading, error, setError } = useFeedback();

  const [categoria, setCategoria] = useState<FeedbackCategory | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCategoria(null);
      setMensagem("");
      setSubmitted(false);
      setError(null);
    }
  }, [visible, setError]);

  const categoriaError = submitted && categoria === null;
  const mensagemError = submitted && mensagem.trim() === "";

  const handleSubmit = async () => {
    setSubmitted(true);
    if (categoria === null || mensagem.trim() === "") return;

    const sent = await sendFeedback({ categoria, mensagem });
    if (!sent) return;

    showToast({
      mode: "success",
      title: t("feedback.successTitle"),
      description: t("feedback.successMessage"),
    });
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: "92%",
            maxWidth: 400,
            backgroundColor: colors.level2,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: colors.outline,
            padding: 20,
            gap: 14,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: "Inter-Bold", fontSize: 18, color: colors.content }}>
              {t("feedback.title")}
            </Text>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              {t("feedback.subtitle")}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              {t("feedback.category")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CATEGORIES.map((c) => {
                const isSelected = categoria === c.id;
                return (
                  <RipplePressable
                    key={c.id}
                    onPress={() => setCategoria(c.id)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? colors.primary
                        : categoriaError
                          ? colors.error
                          : colors.outline,
                      backgroundColor: isSelected
                        ? withOpacity(colors.primary, 0.12)
                        : colors.level1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 13,
                        color: isSelected ? colors.primary : colors.content,
                      }}
                    >
                      {t(c.labelKey)}
                    </Text>
                  </RipplePressable>
                );
              })}
            </View>
            {categoriaError && (
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                {t("feedback.categoryRequired")}
              </Text>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              {t("feedback.messageLabel")}
            </Text>
            <TextInput
              value={mensagem}
              onChangeText={(text) => {
                setMensagem(text);
                if (error) setError(null);
              }}
              placeholder={t("feedback.messagePlaceholder")}
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={MAX_LENGTH}
              style={{
                minHeight: 96,
                textAlignVertical: "top",
                color: colors.content,
                fontFamily: "Inter-Medium",
                fontSize: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: mensagemError ? colors.error : colors.outline,
                backgroundColor: colors.level1,
                paddingVertical: 11,
                paddingHorizontal: 14,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {mensagemError ? (
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                  {t("feedback.messageRequired")}
                </Text>
              ) : (
                <View />
              )}
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.muted }}>
                {mensagem.length}/{MAX_LENGTH}
              </Text>
            </View>
          </View>

          {error && (
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 13, color: colors.error, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
            <DefaultButton
              label={t("feedback.cancel")}
              onPress={onClose}
              sizeClass="flex-1 h-11"
              bgColorClass="bg-level1"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              className="rounded-[12px]"
              disabled={loading}
            />
            <DefaultButton
              label={loading ? t("feedback.sending") : t("feedback.send")}
              onPress={handleSubmit}
              sizeClass="flex-1 h-11"
              className="rounded-[12px]"
              disabled={loading}
            />
          </View>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}

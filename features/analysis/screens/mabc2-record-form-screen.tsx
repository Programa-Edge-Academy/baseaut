import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultScrollView } from "@/components/default-scroll-view";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast, type ToastMode } from "@/components/toast";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useKeyboardAwareScroll } from "@/lib/use-keyboard-aware-scroll";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { Edit2, Share2, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Mabc2MotorDevelopmentCard } from "../components/mabc2-motor-development-card";
import { Mabc2SectionProps } from "../components/mabc2-section";

/** Props for {@link Mabc2RecordFormScreen}. */
export type Mabc2RecordFormScreenProps = {
  studentName: string;
  recordCount: number;
  totalScore: number | null;
  totalPercentile: string | null;
  sections: Mabc2SectionProps[];
  readOnly?: boolean;
  showErrors?: boolean;
  submitLabel?: string;
  toastConfig?: { visible: boolean; mode: ToastMode; title: string; description?: string };
  onHideToast?: () => void;
  onChangeTotalScore?: (value: string) => void;
  onChangeTotalPercentile?: (value: string) => void;
  onRegister?: () => void;
  onPressBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
};

/**
 * Presentational screen for viewing or editing a MABC-2 record: total scores and
 * sections, plus edit/share/delete actions and a delete confirmation in
 * read-only mode. The focused score input is kept above the keyboard (see
 * {@link useKeyboardAwareScroll}) and the scroll content grows by the keyboard
 * height (see {@link useKeyboardPadding}) so inputs are never covered.
 */
export function Mabc2RecordFormScreen({
  studentName,
  recordCount,
  totalScore,
  totalPercentile,
  sections,
  readOnly = false,
  showErrors = false,
  submitLabel,
  toastConfig,
  onHideToast,
  onChangeTotalScore,
  onChangeTotalPercentile,
  onRegister,
  onPressBack,
  onEdit,
  onDelete,
  onShare,
}: Mabc2RecordFormScreenProps) {
  const { t } = useI18n();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const keyboardPadding = useKeyboardPadding();
  const keyboardAwareScroll = useKeyboardAwareScroll();
  const resolvedSubmitLabel = submitLabel ?? t("common.register");

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <PageHeader
            title={`MABC-2 - ${studentName}`}
            subtitle={t("analysis.motorDev")}
          />
        </View>

        {readOnly && (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onEdit}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-outline bg-level2 active:opacity-70"
            >
              <Edit2 size={18} color={colors.muted} />
            </Pressable>

            {onShare && (
              <Pressable
                onPress={onShare}
                className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-70"
                style={{
                  borderWidth: 1,
                  borderColor: colors.secondary,
                  backgroundColor: `${colors.secondary}1A`,
                }}
              >
                <Share2 size={18} color={colors.secondary} />
              </Pressable>
            )}

            <Pressable
              onPress={() => setIsDeleteModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-70"
              style={{
                borderWidth: 1,
                borderColor: colors.error,
                backgroundColor: `${colors.error}1A`,
              }}
            >
              <Trash2 size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>

      <DefaultScrollView
        {...keyboardAwareScroll}
        className="flex-1 mt-4"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32 + keyboardPadding,
        }}
      >
        <Mabc2MotorDevelopmentCard
          recordCount={recordCount}
          totalScore={totalScore}
          totalPercentile={totalPercentile}
          sections={sections}
          onChangeTotalScore={onChangeTotalScore}
          onChangeTotalPercentile={onChangeTotalPercentile}
          onRegister={onRegister}
          readOnly={readOnly}
          showErrors={showErrors}
          submitLabel={resolvedSubmitLabel}
        />
      </DefaultScrollView>

      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          onDelete?.();
        }}
        title={t("analysis.mabcForm.deleteTitle")}
        message={t("analysis.mabcForm.deleteMessage")}
        mode="delete"
      />

      {toastConfig && (
        <Toast
          visible={toastConfig.visible}
          mode={toastConfig.mode}
          title={toastConfig.title}
          description={toastConfig.description}
          onHide={onHideToast}
        />
      )}
    </View>
  );
}
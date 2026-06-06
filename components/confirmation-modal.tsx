import { AlertCircle, LogOut, Trash2, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";

export interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  iconType?: "trash" | "alert" | "logout";
  mode?: "delete" | "finishSession" | "logout" | "finishEngagement";
}

export function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  iconType,
  mode = "delete",
}: ConfirmationModalProps) {
  
  const isFinishMode = mode === "finishSession";
  const isLogoutMode = mode === "logout";
  const isFinishEngagementMode = mode === "finishEngagement";

  const config = {
    title: title ?? (isFinishMode || isFinishEngagementMode ? "Finalizar sessão?" : isLogoutMode ? "Sair da conta?" : "Excluir"),
    message: message ?? (
      isFinishEngagementMode
      ? "O progresso atual desta atividade de engajamento será salvo de acordo com o tipo de circuito escolhido."
      : isFinishMode 
      ? "O progresso atual desta sessão será salvo de acordo com o tipo de circuito escolhido." 
      : isLogoutMode
      ? "Você será redirecionado para a tela de login."
      : "Tem certeza que deseja excluir? Esta ação não poderá ser desfeita."
    ),
    confirmLabel: confirmLabel ?? (isFinishMode || isFinishEngagementMode ? "Finalizar" : isLogoutMode ? "Sair" : "Excluir"),
    cancelLabel: cancelLabel ?? "Cancelar",
    iconType: iconType ?? (isLogoutMode ? "logout" : isFinishMode || isFinishEngagementMode ? "alert" : "trash"),
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[400px] p-6 space-y-4">
          <View className="flex-row items-center space-x-4">
            <View 
              className={`w-14 h-14 rounded-full items-center justify-center ${
                isLogoutMode || isFinishMode || isFinishEngagementMode ? 'bg-level1 border border-outline' : 'bg-error/10 border border-error'
              }`}
            >
              {config.iconType === "trash" ? (
                <Trash2 size={30} color={colors.error} />
              ) : config.iconType === "logout" ? (
                <LogOut size={30} color={colors.error} />
              ) : isFinishEngagementMode ? (
                <AlertCircle size={30} color={colors.extra} />
              ) : (
                <AlertCircle size={30} color={colors.error} />
              )}
            </View>

            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-header-2">
                {config.title}
              </Text>
              <Pressable onPress={onClose} className="p-1 active:opacity-70">
                <X size={24} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-muted text-default-1 leading-5">
            {config.message}
          </Text>

          <View className="flex-row justify-center gap-2.5">
            <DefaultButton
              label={config.cancelLabel}
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              sizeClass="w-40 h-11"
              onPress={onClose}
            />

            <DefaultButton
              label={config.confirmLabel}
              textClassName={isFinishEngagementMode ? "text-level1" : "text-white"}
              bgColorClass={isFinishEngagementMode ? "bg-extra" : "bg-error"}
              shadowClass={isFinishEngagementMode ? "shadow-none" : "shadow-errorShadow"}
              sizeClass="w-40 h-11"
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
import { AppModal } from "@/components/app-modal";
import { AlertCircle, LogOut, Trash2, X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/assets/colors";
import { ActionButtons } from "./action-buttons";

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
    <AppModal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[400px] p-6 gap-6">
          <View className="flex-row items-center space-x-4">
            <View 
              className={`mr-4 rounded-full items-center justify-center`}
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

          <ActionButtons
            onCancel={onClose}
            onSave={onConfirm}
            cancelLabel={config.cancelLabel}
            saveLabel={config.confirmLabel}
            mode={isFinishEngagementMode ? "warning" : "danger"}
          />
        </View>
      </View>
    </AppModal>
  );
}
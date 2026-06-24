import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { Calendar, Check, ClipboardEdit, Download, Edit2, History, Trash2, Share2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type HeaderMode =
  | "inicio"
  | "inicio-pendente"
  | "exercicios"
  | "relatorios"
  | "relatorios-aluno"
  | "registro"
  | "registro-editando"
  | "sessoes"
  | "sessao-historico"
  | "sessao-historico-pendente"
  | "execucao"
  | "historico-estudante"
  | "relatorio-detalhe";

export type PageHeaderProps = {
  containerClassName?: string;
  mode?: HeaderMode;
  title: string;
  subtitle: string;
  onNewPress?: () => void;
  onHistoryPress?: () => void;
  onCalendarPress?: () => void;
  onEditPress?: () => void;
  /** Destaca o botão de edição (lápis) em amarelo, ex.: RC com pendências. */
  editPending?: boolean;
  onDeletePress?: () => void;
  onCheckPress?: () => void;
  onFormPress?: () => void;
  onSharePress?: () => void;
  onExportPress?: () => void;
  isExportActive?: boolean;
  totalExercises?: number;
  completedExercises?: number;
  isExecuting?: boolean;
};

export function PageHeader({
  containerClassName,
  mode,
  title,
  subtitle,
  onNewPress,
  onHistoryPress,
  onCalendarPress,
  onEditPress,
  editPending = false,
  onDeletePress,
  onCheckPress,
  onFormPress,
  onSharePress,
  onExportPress,
  isExportActive = false,
  totalExercises = 1,
  completedExercises = 0,
  isExecuting = false,
}: PageHeaderProps) {

  const renderNovoBtn = () => (
    <Pressable
      onPress={onNewPress}
      className="h-10 w-20 items-center justify-center rounded-2xl bg-primary shadow-primaryShadow active:opacity-80"
    >
      <Text className="text-header-3 text-white">+ Novo</Text>
    </Pressable>
  );

  const renderRightContent = () => {
    switch (mode) {
      case "inicio":
      case "inicio-pendente": {
        const isPending = mode === "inicio-pendente";
        return (
          <View className="flex-row items-center gap-5">
            <Pressable onPress={onHistoryPress} className="active:opacity-70">
              <History
                size={20}
                color={isPending ? colors.extra : colors.muted}
              />
            </Pressable>
            {renderNovoBtn()}
          </View>
        );
      }

      case "exercicios":
        return renderNovoBtn();

      case "relatorios":
        return (
          <View className="flex-row items-center gap-5">
            <Pressable onPress={onCalendarPress} className="active:opacity-70">
              <Calendar size={20} color={colors.muted} />
            </Pressable>
            {renderNovoBtn()}
          </View>
        );

      case "relatorios-aluno":
        return (
          <View className="flex-row items-center gap-5">
            <Pressable onPress={onExportPress} className="active:opacity-70">
              <Download size={20} color={isExportActive ? colors.primary : colors.muted} />
            </Pressable>
            {!isExportActive && renderNovoBtn()}
          </View>
        );

      case "sessoes":
        return (
          <Pressable onPress={onCalendarPress} className="active:opacity-70">
            <Calendar size={20} color={colors.muted} />
          </Pressable>
        );

      case "registro":
      case "registro-editando": {
        const isEditing = mode === "registro-editando";
        return (
          <View className="flex-row items-center gap-5">
            {isEditing ? (
              <Pressable
                onPress={onCheckPress}
                className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
                style={{ borderColor: colors.primary, backgroundColor: colors.level1 }}
              >
                <Check size={16} color={colors.primary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={onEditPress}
                className="items-center justify-center rounded-[10px] border border-outline bg-level2 p-2.5 active:opacity-70"
              >
                <Edit2 size={16} color={colors.muted} />
              </Pressable>
            )}

            <Pressable
              onPress={onDeletePress}
              className="items-center justify-center rounded-[10px] border active:opacity-70"
              style={{
                borderColor: colors.error,
                backgroundColor: withOpacity(colors.error, 0.1),
                padding: 10,
              }}
            >
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        );
      }

      case "sessao-historico":
      case "sessao-historico-pendente": {
        const isPending = mode === "sessao-historico-pendente";
        const contentColor = isPending ? colors.extra : colors.muted;
        const borderColor = isPending ? colors.extra : colors.outline;
        const bgColor = isPending ? withOpacity(colors.extra, 0.1) : colors.level1;

        return (
          <Pressable
            onPress={onFormPress}
            className="h-10 flex-row items-center justify-center gap-2 rounded-2xl border px-4 active:opacity-70"
            style={{ borderColor, backgroundColor: bgColor }}
          >
            <ClipboardEdit size={16} color={contentColor} />
            <Text
              className="text-default-2"
              style={{ color: contentColor }}
            >
              Formulário
            </Text>
          </Pressable>
        );
      }

      case "execucao": {
        const current = completedExercises + 1;
        let start = 1;
        if (totalExercises >= 3) {
          start = Math.max(1, Math.min(current - 1, totalExercises - 2));
        }

        const nodeCount = Math.min(3, totalExercises);
        const nodes = Array.from({ length: nodeCount }, (_, i) => start + i);

        return (
          <View className="flex-row items-center">
            {start > 1 && (
              <View className="h-[2px] w-3" style={{ backgroundColor: colors.primary }} />
            )}

            {nodes.map((node, index) => {
              const isNodeActive = node <= current;
              const hasNextInWindow = index < nodes.length - 1;
              const isNextLineActive = (node + 1) <= current || (node === current && isExecuting);

              return (
                <React.Fragment key={node}>
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: isNodeActive ? colors.primary : colors.level2 }}
                  >
                    <Text className={`text-default-2 ${isNodeActive ? "text-white" : "text-muted"}`}>
                      {node}
                    </Text>
                  </View>

                  {hasNextInWindow && (
                    <View
                      className="h-[2px] w-3"
                      style={{ backgroundColor: isNextLineActive ? colors.primary : colors.level2 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
            {nodes[nodes.length - 1] < totalExercises && (
              <View
                className="h-[2px] w-3"
                style={{ backgroundColor: colors.level2 }}
              />
            )}
          </View>
        );
      }

      case "historico-estudante":
        return (
          <View className="flex-row items-center gap-3">
            {onEditPress && (
              <Pressable
                onPress={onEditPress}
                className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
                style={{
                  borderColor: editPending ? colors.extra : colors.primary,
                  backgroundColor: withOpacity(
                    editPending ? colors.extra : colors.primary,
                    0.1,
                  ),
                }}
              >
                <Edit2 size={16} color={editPending ? colors.extra : colors.primary} />
              </Pressable>
            )}

            {onSharePress && (
              <Pressable
                onPress={onSharePress}
                className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
                style={{
                  borderColor: colors.secondary,
                  backgroundColor: withOpacity(colors.secondary, 0.1),
                }}
              >
                <Share2 size={16} color={colors.secondary} />
              </Pressable>
            )}

            {onDeletePress && (
              <Pressable
                onPress={onDeletePress}
                className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
                style={{
                  borderColor: colors.error,
                  backgroundColor: withOpacity(colors.error, 0.1),
                }}
              >
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            )}
          </View>
        );

      case "relatorio-detalhe":
        return (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onExportPress}
              className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
              style={{
                borderColor: colors.primary,
                backgroundColor: withOpacity(colors.primary, 0.1),
              }}
            >
              <Download size={16} color={colors.primary} />
            </Pressable>

            <Pressable
              onPress={onDeletePress}
              className="items-center justify-center rounded-[10px] border p-2.5 active:opacity-70"
              style={{
                borderColor: colors.error,
                backgroundColor: withOpacity(colors.error, 0.1),
              }}
            >
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className={`w-full min-h-[44px] flex-row items-center justify-between ${containerClassName ?? ""}`}>
      <View className="flex-1 flex-col justify-center gap-1 mr-4">
        <Text className="text-header-1 text-white">{title}</Text>
        <Text className="text-default-1 text-muted">{subtitle}</Text>
      </View>

      <View>{renderRightContent()}</View>
    </View>
  );
}
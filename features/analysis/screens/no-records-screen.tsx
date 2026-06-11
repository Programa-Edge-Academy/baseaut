import { colors } from "@/assets/colors";
import { DefaultScrollView } from "@/components/default-scroll-view";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { AlertCircle, ChartNoAxesColumnIncreasingIcon, ChartNoAxesCombined, ClipboardListIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type NoRecordsScreenVariant = "sessions" | "protocol" | "help" | "behavior" | "loadRecords" | "loadEvolution" | "loadBehavior";

export type NoRecordsScreenProps = {
  variant?: NoRecordsScreenVariant;
  studentName?: string;
  title?: string;
  message?: string;
  onPressBack?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

const VARIANT_CONFIG: Record<
  NoRecordsScreenVariant,
  {
    title: string;
    message: string;
    icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
    accentColor: string;
  }
> = {
  sessions: {
    title: "Ainda não há registros de sessão",
    message: "Quando houver uma sessão salva para este aluno, ela aparecerá aqui para acompanhamento.",
    icon: ChartNoAxesCombined,
    accentColor: colors.primary,
  },
  protocol: {
    title: "Ainda não há registro deste protocolo",
    message: "Os dados deste protocolo aparecerão aqui assim que houver um registro válido.",
    icon: ClipboardListIcon,
    accentColor: "#F59E0B",
  },
  help: {
    title: "Não há evolução de ajuda para exibir",
    message: "Os registros de ajuda por sessão ficarão disponíveis quando houver dados suficientes.",
    icon: ChartNoAxesColumnIncreasingIcon,
    accentColor: "#34C759",
  },
  behavior: {
    title: "Nenhum comportamento observado registrado",
    message: "Os comportamentos observados aparecerão aqui quando houver registros no período selecionado.",
    icon: ChartNoAxesColumnIncreasingIcon,
    accentColor: "#8B5CF6",
  },
  loadRecords: {
    title: "Não foi possível carregar os registros",
    message: "Tente novamente em alguns instantes ou verifique sua conexão para acessar os dados do aluno.",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
  loadEvolution: {
    title: "Não foi possível carregar a evolução",
    message: "Os dados de evolução de ajuda não puderam ser carregados no momento.",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
  loadBehavior: {
    title: "Não foi possível carregar os comportamentos",
    message: "Não conseguimos acessar os comportamentos observados para este período agora.",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
};

export function NoRecordsScreen({
  variant = "sessions",
  studentName = "Aluno",
  title,
  message,
  onPressBack,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = "Voltar",
  secondaryActionLabel,
}: NoRecordsScreenProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5">
        <PageHeader
          title={`Sem registros — ${studentName}`}
          subtitle="Estado vazio para teste"
        />
      </View>

      <DefaultScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="flex-1 items-center justify-center px-2 py-8">
          <View className="w-full rounded-[32px] border border-outline bg-level2 p-6">
            <View
              className="mb-5 items-center justify-center rounded-[24px] p-5"
              style={{ backgroundColor: `${config.accentColor}14` }}
            >
              <Icon size={56} color={config.accentColor} strokeWidth={2} />
            </View>

            <Text className="text-center text-[22px] font-bold text-white" style={{ fontFamily: "Inter-Bold" }}>
              {title ?? config.title}
            </Text>

            <Text className="mt-3 text-center text-[14px] leading-6 text-muted" style={{ fontFamily: "Inter-Medium" }}>
              {message ?? config.message}
            </Text>

            <View className="mt-6 gap-3">
              {onPrimaryAction ? (
                <Pressable
                  onPress={onPrimaryAction}
                  className="items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-[14px] font-semibold text-white">{primaryActionLabel}</Text>
                </Pressable>
              ) : null}

              {secondaryActionLabel && onSecondaryAction ? (
                <Pressable
                  onPress={onSecondaryAction}
                  className="items-center rounded-2xl border border-outline bg-level3 px-4 py-3"
                >
                  <Text className="text-[14px] font-semibold text-white">{secondaryActionLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </DefaultScrollView>
    </View>
  );
}

import { ChartNoAxesColumnIncreasingIcon, ChartNoAxesCombined, ClipboardListIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

type AnalysisErrorCardVariant = "loadRecords" | "noRecords" | "noEvolution" | "loadEvolution" | "loadBehavior" | "noBehavior" | "noProtocol";

type AnalysisErrorCardProps = {
  variant?: AnalysisErrorCardVariant;
  title?: string;
  message?: string;
};

type AnalysisErrorCardIcon = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const VARIANT_CONFIG: Record<AnalysisErrorCardVariant, {
  title: string;
  message: string;
  iconBgClass: string;
  borderClass: string;
  Icon: AnalysisErrorCardIcon;
}> = {
  loadRecords: {
    title: "Falha ao carregar os registros",
    message: "Não foi possível acessar os dados do aluno. Tente novamente mais tarde.",
    iconBgClass: "bg-level1",
    borderClass: "border-error/20",
    Icon: ChartNoAxesCombined,
  },
  noRecords: {
    title: "Nenhum registro encontrado",
    message: "Este aluno ainda não possui registros de sessão.",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ChartNoAxesCombined,
  },
  noEvolution: {
    title: "Ainda não há registros suficientes para visualizar a evolução dos registros de ajuda.",
    message: "",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ChartNoAxesColumnIncreasingIcon,
  },
  loadEvolution: {
    title: "Não foi possível carregar a evolução dos registros de ajuda. Tente novamente.",
    message: "Verifique sua conexão ou tente acessar os dados novamente mais tarde.",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ChartNoAxesColumnIncreasingIcon,
  },
  noBehavior: {
    title: "Ainda não há comportamentos observados registrados para o período selecionado.",
    message: "",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ChartNoAxesColumnIncreasingIcon,
  },
  loadBehavior: {
    title: "Não foi possível carregar os comportamentos observados. Tente novamente.",
    message: "Verifique sua conexão ou tente acessar os dados novamente mais tarde.",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ChartNoAxesColumnIncreasingIcon,
  },
  noProtocol: {
    title: "Ainda não há registro deste protocolo para este aluno.",
    message: "Quando houver um registro, os dados ficarão disponíveis para visualização nesta tela",
    iconBgClass: "bg-level1",
    borderClass: "border-outline",
    Icon: ClipboardListIcon,
  },
};

export function AnalysisErrorCard({
  variant = "loadRecords",
  title,
  message,
}: AnalysisErrorCardProps) {
  const config = VARIANT_CONFIG[variant];

  const Icon = config.Icon;

  return (
    <View className={`w-full bg-level2 ${config.borderClass} rounded-[32px] p-5 mb-4 overflow-hidden`}>
      <View className={`items-center justify-center rounded-[22px] ${config.iconBgClass} p-4 mb-4`}>
        <Icon size={52} color="#66758A" strokeWidth={2} />
      </View>

      <Text
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: "Inter-Bold" }}
      >
        {title ?? config.title}
      </Text>
      <Text
        className="text-sm text-muted leading-6 mb-5"
        style={{ fontFamily: "Inter-Medium" }}
      >
        {message ?? config.message}
      </Text>
    </View>
  );
}

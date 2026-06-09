import { colors } from "@/assets/colors";
import React from "react";
import { Image, Text, View } from "react-native";
import { User } from "lucide-react-native";

type InfoChipProps = {
  label: string;
  value: string | null | undefined;
};

function InfoChip({ label, value }: InfoChipProps) {
  if (!value) return null;
  return (
    <View className="flex-1 bg-level1 border border-outline rounded-[10px] px-[10px] py-[5px]">
      <Text
        className="text-[11px] text-muted"
        style={{ fontFamily: "Inter-Medium" }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="text-[12px] text-white font-bold mt-0.5"
        style={{ fontFamily: "Inter-Bold" }}
      >
        {value}
      </Text>
    </View>
  );
}

export type StudentInfoCardProps = {
  name: string;
  avatarUrl: string | null | undefined;
  height: number | null | undefined;
  weight: number | null | undefined;
  waist: number | null | undefined;
  birthDate: string | null | undefined;
  supportLevel: string | null | undefined;
  observations: string | null | undefined;
};

function calculateAge(birthDateStr: string | null | undefined): string | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} anos`;
}

export function StudentInfoCard({
  name,
  avatarUrl,
  height,
  weight,
  waist,
  birthDate,
  supportLevel,
  observations,
}: StudentInfoCardProps) {
  const ageStr = calculateAge(birthDate);

  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px] mb-4">
      {/* Título */}
      <Text
        className="text-[16px] font-bold text-white mb-4"
        style={{ fontFamily: "Inter-Bold" }}
      >
        Informações da criança
      </Text>

      {/* Foto de perfil centralizada */}
      <View className="items-center mb-4">
        <View className="w-[100px] h-[100px] rounded-[15px] bg-level1 overflow-hidden items-center justify-center">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 15 }}
              resizeMode="cover"
            />
          ) : (
            <User size={40} color={colors.muted} />
          )}
        </View>
      </View>

      {/* Grid de informações — 2 colunas */}
      <View className="flex-col gap-2">
        {/* Linha 1 */}
        <View className="flex-row gap-2">
          <InfoChip label="Nome" value={name} />
          <InfoChip label="Altura" value={height != null ? `${height} cm` : null} />
        </View>

        {/* Linha 2 */}
        <View className="flex-row gap-2">
          <InfoChip label="Idade" value={ageStr} />
          <InfoChip label="Nível de suporte do TEA" value={supportLevel} />
        </View>

        {/* Linha 3 */}
        <View className="flex-row gap-2">
          <InfoChip label="Peso" value={weight != null ? `${weight} kg` : null} />
          {/* Observações ocupa a coluna da direita e se expande verticalmente */}
          <View className="flex-1 bg-level1 border border-outline rounded-[10px] px-[10px] py-[5px]">
            <Text
              className="text-[11px] text-muted"
              style={{ fontFamily: "Inter-Medium" }}
            >
              Observações gerais
            </Text>
            <Text
              className="text-[12px] text-white font-bold mt-0.5"
              style={{ fontFamily: "Inter-Bold" }}
            >
              {observations || "—"}
            </Text>
          </View>
        </View>

        {/* Linha 4 — cintura em coluna única à esquerda */}
        <View className="flex-row gap-2">
          <InfoChip
            label="Circunferência da cintura"
            value={waist != null ? `${waist} cm` : null}
          />
          {/* Espaço em branco para manter a grade alinhada */}
          <View className="flex-1" />
        </View>
      </View>
    </View>
  );
}

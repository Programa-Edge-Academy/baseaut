import { colors } from "@/assets/colors";
import { calculateAge } from "@/lib/date-utils";
import { User } from "lucide-react-native";
import React from "react";
import { Image, Text, View } from "react-native";

/** Props for {@link InfoChip}. */
type InfoChipProps = {
  label: string;
  value: string | null | undefined;
};

/** Small labeled value chip used in the student info grid. */
function InfoChip({ label, value }: InfoChipProps) {
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
        {value ? value : "—"}
      </Text>
    </View>
  );
}

/** Props for {@link StudentInfoCard}. */
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

/** Profile card showing a student's photo and clinical/anthropometric details. */
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
  const ageStr = birthDate ? `${calculateAge(birthDate)} anos` : null;

  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px] mb-4">
      <Text
        className="text-[16px] font-bold text-white mb-4"
        style={{ fontFamily: "Inter-Bold" }}
      >
        Informações da criança
      </Text>

      <View className="items-center mb-4">
        <View className={`w-[100px] h-[100px] rounded-[15px] bg-level1 overflow-hidden items-center justify-center ${avatarUrl ? '' : 'border border-outline'}`}>
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

      <View className="flex-col gap-2">
        <View className="flex-row gap-2">
          <InfoChip label="Nome" value={name} />
          <InfoChip label="Idade" value={ageStr} />
        </View>

        <View className="flex-row gap-2">
          <InfoChip label="Nível de suporte do TEA" value={supportLevel} />
          <InfoChip label="Massa" value={weight != null ? `${weight} kg` : null} />
        </View>

        <View className="flex-row gap-2">
          <InfoChip label="Estatura" value={height != null ? `${height} cm` : null} />
          <InfoChip label="Cintura" value={waist != null ? `${waist} cm` : null} />
        </View>

        <View className="flex-row gap-2">
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
      </View>
    </View>
  );
}

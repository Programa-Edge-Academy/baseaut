import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
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
        className="text-[12px] text-content font-bold mt-0.5"
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
  const { t } = useI18n();
  const ageStr = birthDate ? `${calculateAge(birthDate)} ${t("common.yearsOld")}` : null;

  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px] mb-4">
      <Text
        className="text-[16px] font-bold text-content mb-4"
        style={{ fontFamily: "Inter-Bold" }}
      >
        {t("analysis.info.title")}
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
          <InfoChip label={t("analysis.info.name")} value={name} />
          <InfoChip label={t("analysis.info.age")} value={ageStr} />
        </View>

        <View className="flex-row gap-2">
          <InfoChip label={t("analysis.info.supportLevel")} value={supportLevel} />
          <InfoChip label={t("students.form.weight")} value={weight != null ? `${weight} kg` : null} />
        </View>

        <View className="flex-row gap-2">
          <InfoChip label={t("students.form.height")} value={height != null ? `${height} cm` : null} />
          <InfoChip label={t("students.form.waist")} value={waist != null ? `${waist} cm` : null} />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 bg-level1 border border-outline rounded-[10px] px-[10px] py-[5px]">
            <Text
              className="text-[11px] text-muted"
              style={{ fontFamily: "Inter-Medium" }}
            >
              {t("analysis.info.generalObservations")}
            </Text>
            <Text
              className="text-[12px] text-content font-bold mt-0.5"
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

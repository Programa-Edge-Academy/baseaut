import { AppModal } from "@/components/app-modal";
import { X } from "lucide-react-native";
import React, { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors } from "@/assets/colors";
import { Exercise } from "@/features/exercises/hooks/use-exercises";
import { useI18n } from "@/features/settings/contexts/i18n-context";

type ExecutionMode = "estruturado" | "semi-estruturado";

/** Props for {@link ViewCircuit}. */
interface ViewCircuitProps {
  visible: boolean;
  onClose: () => void;
  /** Circuit to display, or null to render nothing. */
  circuitData: {
    name: string;
    executionMode: ExecutionMode;
    exercises: Exercise[];
  } | null;
}

const STYLES = StyleSheet.create({
  itemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.level1,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  numberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  }
});

/**
 * Read-only modal showing a circuit's name, execution mode, and its exercises
 * (numbered when structured).
 */
export function ViewCircuit({
  visible,
  onClose,
  circuitData
}: ViewCircuitProps) {
  const { t } = useI18n();
  const { height: screenHeight } = useWindowDimensions();

  const frozenTitle = useRef(circuitData?.name || t("circuits.circuitDetails"));
  if (circuitData?.name) {
    frozenTitle.current = circuitData.name;
  }

  if (!circuitData) {
    return null;
  }

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View
          className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[900px] overflow-hidden relative"
          style={{ maxHeight: screenHeight * 0.85 }}
        >
          <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
            <Text className="text-content text-header-2">{frozenTitle.current}</Text>
            <Pressable onPress={onClose} className="p-1 active:opacity-70">
              <X size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-shrink"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 }}
          >
            <View className="gap-5 mb-5">
              <View>
                <Text className="text-muted text-default-2 mb-1">{t("circuits.form.name")}</Text>
                <Text className="text-content text-default-1">{circuitData.name}</Text>
              </View>

              <View>
                <Text className="text-muted text-default-2 mb-2">{t("circuits.form.type")}</Text>
                {circuitData.executionMode === "estruturado" ? (
                  <View className="p-3.5 rounded-xl border border-primary bg-primary/10">
                    <Text className="text-content text-default-1 mb-1 font-bold">{t("circuits.form.structured")}</Text>
                    <Text className="text-muted text-default-3">{t("circuits.doesAllExercises")}</Text>
                  </View>
                ) : (
                  <View className="p-3.5 rounded-xl border border-primary bg-primary/10">
                    <Text className="text-content text-default-1 mb-1 font-bold">{t("circuits.form.semi")}</Text>
                    <Text className="text-muted text-default-3">{t("circuits.form.semiDesc")}</Text>
                  </View>
                )}
              </View>

            </View>

            {circuitData.exercises.length > 0 && (
              <View className="mt-2">
                <Text className="text-content text-default-1 mb-4 font-bold">
                  {circuitData.executionMode === "estruturado" ? t("circuits.exerciseOrder") : t("circuits.includedExercises")}
                </Text>

                {circuitData.exercises.map((item, index) => (
                  <View key={item.id} style={STYLES.itemBox}>
                    {circuitData.executionMode === "estruturado" && (
                      <View style={STYLES.numberBox}>
                        <Text style={STYLES.numberText}>{index + 1}</Text>
                      </View>
                    )}
                    <Text style={STYLES.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </AppModal>
  );
}
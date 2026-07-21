import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { SearchInput } from "@/components/search-input";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { ClipboardEdit, Layers } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

/** Selectable item type on the circuit selection screen (circuit or form). */
export type CircuitType =
  | "estruturado"
  | "semi-estruturado"
  | "ata"
  | "cars"
  | "mabc"
  | "mabc2";

/** Exercise data carried by a selectable circuit. */
export type CircuitSelectionExercise = {
  id: string;
  name: string;
  description: string;
  iconUrl?: string | null;
};

/** A selectable entry (circuit or form) on the circuit selection screen. */
export type CircuitItem = {
  id: string;
  name: string;
  description: string;
  type: CircuitType;
  /** Exercises linked to the circuit, forwarded to the running session. */
  exercises?: CircuitSelectionExercise[];
};

/** Props for {@link CircuitSelectionScreen}. */
export type CircuitSelectionScreenProps = {
  studentName: string;
  circuits?: CircuitItem[];
  /**
   * While true, shows a spinner instead of the list (avoids showing the forms
   * before the circuits finish loading).
   */
  isLoading?: boolean;
  onPressBack?: () => void;
  onPressCircuit?: (circuit: CircuitItem) => void;
  /** Tutorial mode: shows the "Em tutorial" header button, notice and spotlight. */
  tutorial?: boolean;
  /** Returns the spotlight keys for an item, or undefined for no highlight. */
  getSpotlightKeys?: (item: CircuitItem) => string[] | undefined;
};

/**
 * Lets the user pick which circuit (or the ATA form) to run inside an
 * already-opened session. Used both as the real screen and, with `tutorial`,
 * as part of the guided session simulation.
 */
export function CircuitSelectionScreen({
  studentName,
  circuits = [],
  isLoading = false,
  onPressBack,
  onPressCircuit,
  tutorial = false,
  getSpotlightKeys,
}: CircuitSelectionScreenProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return circuits;
    return circuits.filter((circuit) =>
      circuit.name.toLowerCase().includes(normalized)
    );
  }, [query, circuits]);

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={onPressBack}
        onPressTutorial={tutorial ? () => setNoticeOpen(true) : undefined}
      />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <Text className="text-header-1 text-content">
            {t("sessions.circuitSelection.title").replace("{name}", studentName)}
          </Text>
          <Text className="mt-1 text-default-1 text-muted">
            {t("sessions.circuitSelection.subtitle")}
          </Text>
        </View>

        <SearchInput
          containerClassName="mx-8 mt-5"
          placeholder={t("common.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <DataList
          className="mt-5 px-8"
          data={filtered}
          emptyMessage={t("sessions.circuitSelection.empty")}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isForm = item.type === "ata" || item.type === "cars" || item.type === "mabc";
            const badge =
              item.type === "estruturado"
                ? { label: t("sessions.badge.structured"), color: colors.primary }
                : item.type === "semi-estruturado"
                ? { label: t("sessions.badge.semi"), color: colors.extra }
                : undefined;

            const card = (
              <ListCard
                title={item.name}
                subtitle={item.description}
                icon={
                  isForm ? (
                    <ClipboardEdit size={20} color={colors.primary} />
                  ) : (
                    <Layers size={20} color={colors.secondary} />
                  )
                }
                iconBgColor={withOpacity(
                  isForm ? colors.primary : colors.secondary,
                  0.15
                )}
                badge={badge}
                rightAction="chevron"
                onPress={() => onPressCircuit?.(item)}
                spotlightKeys={getSpotlightKeys?.(item)}
              />
            );

            return card;
          }}
        />
        )}
      </View>

      {tutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => setNoticeOpen(false)}
        />
      )}

      {tutorial && <TutorialSpotlight />}
    </View>
  );
}

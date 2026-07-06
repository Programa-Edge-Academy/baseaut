import { AppModal } from "@/components/app-modal";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import {
  HelpSessionDetail,
  useHelpSessionDetails,
} from "@/features/analysis/hooks/use-help-session-details";
import { ChevronDown, ChevronRight, ListChecks, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

/** Props for {@link HelpRecordsDetailModal}. */
export type HelpRecordsDetailModalProps = {
  studentId?: string;
  /** "YYYY-MM-DD" range start. */
  startDate?: string | null;
  /** "YYYY-MM-DD" range end. */
  endDate?: string | null;
};

/** Colored legend/label for a help-record type. */
function HelpBadge({ registro }: { registro: HelpSessionDetail["exercises"][number]["registroAjuda"] }) {
  const colors = useThemeColors();
  const { t } = useI18n();
  const isIntrusive = registro === "ajuda_intrusiva";
  const color = isIntrusive ? colors.verbal : colors.extra;
  const label = isIntrusive ? t("analysis.help.intrusive") : t("analysis.help.autonomous");
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-default-3" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * A button that opens a modal listing, for the selected student and period,
 * every recorded session as a tappable row that expands to show that session's
 * exercises and their help records.
 *
 * @remarks
 * The list lives in a height-capped, scrollable card so the modal never grows
 * past the screen, regardless of how many sessions or exercises exist. Data
 * comes from {@link useHelpSessionDetails}, which lists every execution with a
 * help record (an exercise repeated in a session appears once per execution).
 */
export function HelpRecordsDetailModal({
  studentId,
  startDate,
  endDate,
}: HelpRecordsDetailModalProps) {
  const colors = useThemeColors();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { sessions, isLoading } = useHelpSessionDetails(studentId, startDate, endDate);

  const listMaxHeight = Math.min(height * 0.6, 460);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-outline bg-level2 py-3 active:opacity-70"
      >
        <ListChecks size={18} color={colors.muted} />
        <Text className="text-default-1 text-content">
          {t("analysis.helpModal.openButton")}
        </Text>
      </Pressable>

      <AppModal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={() => setVisible(false)}
        >
          <Pressable
            className="w-full max-w-[440px] rounded-2xl border border-outline bg-level2 p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-content">{t("analysis.helpModal.title")}</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text className="mt-1 text-default-2 text-muted">
              {t("analysis.helpModal.subtitle")}
            </Text>

            {isLoading ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : sessions.length === 0 ? (
              <Text className="py-8 text-center text-default-2 text-muted">
                {t("analysis.helpModal.empty")}
              </Text>
            ) : (
              <ScrollView
                style={{ maxHeight: listMaxHeight }}
                className="mt-4"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-2.5">
                  {sessions.map((session) => {
                    const isOpen = expanded === session.sessionId;
                    return (
                      <View
                        key={session.sessionId}
                        className="overflow-hidden rounded-2xl border border-outline bg-level1"
                      >
                        <Pressable
                          onPress={() =>
                            setExpanded(isOpen ? null : session.sessionId)
                          }
                          className="flex-row items-center justify-between p-3.5 active:opacity-70"
                        >
                          <View className="flex-1">
                            <Text className="text-default-1 text-content">
                              {t("analysis.helpChart.session")} {session.label}
                            </Text>
                            <Text className="text-default-3 text-muted">
                              {session.dateLabel}
                            </Text>
                          </View>
                          {isOpen ? (
                            <ChevronDown size={18} color={colors.muted} />
                          ) : (
                            <ChevronRight size={18} color={colors.muted} />
                          )}
                        </Pressable>

                        {isOpen && (
                          <View className="gap-2 border-t border-outline px-3.5 pb-3.5 pt-3">
                            {session.exercises.length === 0 ? (
                              <Text className="text-default-3 text-muted">
                                {t("analysis.helpModal.noRecords")}
                              </Text>
                            ) : (
                              session.exercises.map((ex, idx) => (
                                <View
                                  key={`${ex.exerciseId}-${idx}`}
                                  className="flex-row items-center justify-between gap-3"
                                >
                                  <Text
                                    className="flex-1 text-default-2 text-content"
                                    numberOfLines={1}
                                  >
                                    {ex.name}
                                  </Text>
                                  <HelpBadge registro={ex.registroAjuda} />
                                </View>
                              ))
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </AppModal>
    </>
  );
}

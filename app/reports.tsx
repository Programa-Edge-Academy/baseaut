import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { DataList } from "@/components/data-list";
import { DefaultButton } from "@/components/default-button";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import RangeCalendar from "@/components/range-calendar";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { SwipeNavigator } from "@/components/swipe-navigator";
import { Toast } from "@/components/toast";
import { exportConsolidatedReport } from "@/features/reports/utils/export-report";
import { useStudents } from "@/features/students/hooks/use-students";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { User, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from "react-native";

/** Modal for choosing consolidated export formats (PDF/CSV) and delivery mode. */
function FormatPicker({
  visible,
  onClose,
  onExport,
}: {
  visible: boolean;
  onClose: () => void;
  onExport: (formats: { pdf: boolean; csv: boolean }, mode: "share" | "download") => void;
}) {
  const { t } = useI18n();
  const [pdf, setPdf] = useState(true);
  const [csv, setCsv] = useState(false);

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center px-6"
        onPress={onClose}
      >
        <Pressable
          className="bg-level2 border border-outline rounded-2xl p-6 w-full gap-5"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-header-2 text-content">{t("export.selectFormat")}</Text>

          <View className="gap-3">
            <Pressable onPress={() => setPdf((v) => !v)} className="flex-row items-center gap-3">
              <View
                className={`w-5 h-5 rounded border items-center justify-center ${
                  pdf ? "bg-primary border-primary" : "border-outline bg-transparent"
                }`}
              >
                {pdf && <Text className="text-content text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-content text-default-1">{t("export.pdfWithCharts")}</Text>
            </Pressable>
            <Pressable onPress={() => setCsv((v) => !v)} className="flex-row items-center gap-3">
              <View
                className={`w-5 h-5 rounded border items-center justify-center ${
                  csv ? "bg-primary border-primary" : "border-outline bg-transparent"
                }`}
              >
                {csv && <Text className="text-content text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-content text-default-1">{t("export.csvTabular")}</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-3">
              <DefaultButton
                label={t("common.cancel")}
                onPress={onClose}
                bgColorClass="bg-level1"
                shadowClass=""
                sizeClass="flex-1 h-11"
                className="border border-outline"
                textClassName="text-muted"
              />
              <DefaultButton
                label={t("export.exportAction")}
                onPress={() => onExport({ pdf, csv }, "share")}
                sizeClass="flex-1 h-11"
                bgColorClass="bg-primary"
                hasShadow
              />
            </View>

            {Platform.OS === "android" && (
              <DefaultButton
                label={t("export.downloadAction")}
                onPress={() => onExport({ pdf, csv }, "download")}
                sizeClass="w-full h-11"
                bgColorClass="bg-secondary"
                hasShadow={false}
                className="border border-secondary"
                textClassName="text-content"
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}

/**
 * Route for the reports landing screen. Lists students with their report counts,
 * supports name search, navigates to a student's reports, and offers a
 * cross-student mode that selects multiple students plus a period and exports a
 * consolidated evolution report (see {@link exportConsolidatedReport}).
 */
export default function ReportsRoute() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "reports";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { students, isLoading: isStudentsLoading, refresh: refreshStudents } = useStudents({ mock: isTutorial });
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [isCountsLoading, setIsCountsLoading] = useState(!isTutorial);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCrossMode, setIsCrossMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    mode: "success" | "error";
    title: string;
    description?: string;
  }>({ visible: false, mode: "success", title: "" });

  useEffect(() => {
    if (isTutorial) {
      setIsCountsLoading(false);
      return;
    }
    async function fetchCounts() {
      try {
        setIsCountsLoading(true);
        const { data } = await supabase.from("relatorios").select("aluno_id");
        const counts: Record<string, number> = {};
        data?.forEach((r: any) => {
          if (r.aluno_id) counts[r.aluno_id] = (counts[r.aluno_id] || 0) + 1;
        });
        setReportCounts(counts);
      } catch {
      } finally {
        setIsCountsLoading(false);
      }
    }

    if (students.length > 0) {
      fetchCounts();
    } else {
      setIsCountsLoading(false);
    }
  }, [students, isTutorial]);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isStudentsLoading || isCountsLoading;

  const toggleCrossMode = () => {
    setIsCrossMode((v) => !v);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmSelection = () => {
    if (!selectedIds.length) {
      setToast({
        visible: true,
        mode: "error",
        title: t("reports.noStudentSelected"),
        description: t("reports.noStudentSelectedDesc"),
      });
      return;
    }
    setTempStart(null);
    setTempEnd(null);
    setIsPeriodOpen(true);
  };

  const handleSavePeriod = () => {
    if (!tempStart || !tempEnd) return;
    setPeriod({ start: tempStart, end: tempEnd });
    setIsPeriodOpen(false);
    setIsFormatOpen(true);
  };

  const handleExport = async (
    formats: { pdf: boolean; csv: boolean },
    deliveryMode: "share" | "download" = "share",
  ) => {
    setIsFormatOpen(false);
    if (isTutorial) {
      setToast({
        visible: true,
        mode: "success",
        title: deliveryMode === "download" ? t("reports.downloaded") : t("reports.exported"),
        description: t("reports.simulationNoServer"),
      });
      setIsCrossMode(false);
      setSelectedIds([]);
      sim.complete("consolidated");
      return;
    }
    if (!period) return;
    const selected = students
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => ({ id: s.id, name: s.name }));
    try {
      setExporting(true);
      await exportConsolidatedReport(selected, period.start, period.end, formats, t, locale, deliveryMode);
      setToast({
        visible: true,
        mode: "success",
        title: deliveryMode === "download" ? t("reports.downloaded") : t("reports.exported"),
        description: (selected.length === 1
          ? t("reports.consolidatedDescOne")
          : t("reports.consolidatedDescMany")
        ).replace("{n}", String(selected.length)),
      });
      setIsCrossMode(false);
      setSelectedIds([]);
    } catch (err: any) {
      setToast({
        visible: true,
        mode: "error",
        title: t("reports.exportError"),
        description: err?.message ?? t("reports.tryAgain"),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-level1">
      {isTutorial ? (
        <Header
          variant="tutorial"
          onPressBack={() => router.back()}
          onPressFinish={() => setNoticeOpen(true)}
        />
      ) : (
        <Header />
      )}
      <SwipeNavigator onSwipeRight={isTutorial ? () => {} : () => router.replace("/students")}>
      <View className="flex-1 mx-8">
        <View className="mt-5">
          <SectionField mode="reports" />
        </View>

        <View className="mt-5 w-full">
          <PageHeader
            title={t("reports.title")}
            subtitle={
              isCrossMode ? t("reports.subtitleCross") : t("reports.subtitle")
            }
          />
        </View>

        <View className="mt-4 w-full">
          <SearchInput
            placeholder={t("common.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {(() => {
          const crossToggle = (
            <Pressable
              onPress={toggleCrossMode}
              className={`mt-3 flex-row items-center gap-3 rounded-[15px] border p-3.5 active:opacity-70 ${
                isCrossMode ? "border-primary bg-primary/10" : "border-outline bg-level2"
              }`}
            >
              <Users size={20} color={isCrossMode ? colors.primary : colors.muted} />
              <Text
                className="text-default-2"
                style={{ color: isCrossMode ? colors.primary : colors.muted }}
              >
                {t("reports.crossToggle")}
              </Text>
            </Pressable>
          );
          return isTutorial ? (
            <SpotlightTarget targetKey="consolidated">{crossToggle}</SpotlightTarget>
          ) : (
            crossToggle
          );
        })()}

        {isLoading || exporting ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            {exporting && (
              <Text className="mt-3 text-default-2 text-muted">
                {t("reports.generatingConsolidated")}
              </Text>
            )}
          </View>
        ) : (
          <View className="mt-4 w-full flex-1">
            <DataList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              emptyMessage={t("reports.empty")}
              onRefresh={refreshStudents}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: isCrossMode ? 80 : 0 }}
              renderItem={({ item }) => {
                const count = reportCounts[item.id] || 0;
                const isSelected = selectedIds.includes(item.id);
                const card = (
                  <ListCard
                    title={item.name}
                    subtitle={`${count} ${t("reports.recordsSuffix")}`}
                    icon={
                      item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          style={{ width: "100%", height: "100%", borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <User size={20} color={colors.muted} />
                      )
                    }
                    iconBgColor={item.avatarUrl ? "transparent" : undefined}
                    rightAction="none"
                    enableRipple
                    className={isCrossMode && isSelected ? "border border-primary" : undefined}
                    onPress={() => {
                      if (isCrossMode) {
                        toggleSelect(item.id);
                        return;
                      }
                      if (isTutorial) sim.complete("selectStudent");
                      router.push({
                        pathname: "/reports/[studentId]",
                        params: { studentId: item.id, studentName: item.name },
                      } as any);
                    }}
                  />
                );
                return isTutorial && !isCrossMode ? (
                  <SpotlightTarget targetKey="selectStudent">{card}</SpotlightTarget>
                ) : (
                  card
                );
              }}
            />
          </View>
        )}

        {isCrossMode && !exporting && (
          <View className="absolute bottom-8 left-0 right-0 flex-row gap-4">
            <DefaultButton
              label={t("common.cancel")}
              onPress={toggleCrossMode}
              bgColorClass="bg-error"
              sizeClass="flex-1 h-11"
              shadowClass="shadow-errorShadow"
            />
            <DefaultButton
              label={t("reports.confirmCount").replace("{n}", String(selectedIds.length))}
              onPress={handleConfirmSelection}
              bgColorClass="bg-primary"
              sizeClass="flex-1 h-11"
            />
          </View>
        )}
      </View>
      </SwipeNavigator>

      <AppModal
        visible={isPeriodOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPeriodOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsPeriodOpen(false)}
        >
          <Pressable className="w-full max-w-[380px]" onPress={(e) => e.stopPropagation()}>
            <View className="w-full mb-4">
              <RangeCalendar
                key={`cross-${isPeriodOpen}`}
                onRangeSelected={(start: any, end: any) => {
                  const startStr = typeof start === "string" ? start : start?.dateString ?? null;
                  const endStr = typeof end === "string" ? end : end?.dateString ?? null;
                  setTempStart(startStr);
                  setTempEnd(endStr ?? startStr);
                }}
              />
            </View>
            <View className="items-center">
              <DefaultButton
                label={t("common.save")}
                sizeClass="w-full h-11"
                disabled={!tempStart || !tempEnd}
                style={{ opacity: !tempStart || !tempEnd ? 0.5 : 1 }}
                onPress={handleSavePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      <FormatPicker
        visible={isFormatOpen}
        onClose={() => setIsFormatOpen(false)}
        onExport={handleExport}
      />

      <Toast
        visible={toast.visible}
        mode={toast.mode}
        title={toast.title}
        description={toast.description}
        onHide={() => setToast((tt) => ({ ...tt, visible: false }))}
      />

      {!isTutorial && <Footer />}

      {isTutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => {
            setNoticeOpen(false);
            sessionSim.stop();
            router.back();
          }}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
    </View>
  );
}

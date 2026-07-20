import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast } from "@/components/toast";
import { StudentInfoCard } from "@/features/analysis/components/student-info-card";
import { ExerciseProgressChart, ExerciseProgressRecord } from "@/features/analysis/components/exercise-progress-chart";
import { HelpRecordsBarChart, HelpSessionRecord } from "@/features/analysis/components/help-records-bar-chart";
import { HelpRecordsDetailModal } from "@/features/analysis/components/help-records-detail-modal";
import { ObservedBehaviorsChart, BehaviorRecord, BehaviorType } from "@/features/analysis/components/observed-behaviors-chart";
import { BehaviorDetailCard } from "@/features/analysis/components/behavior-detail-card";
import { useObservedBehaviors } from "@/features/analysis/hooks/use-observed-behaviors";
import { AnalysisSummary } from "@/features/analysis/components/analysis-summary";
import ExerciseComparisonCard from "@/features/analysis/components/exercice-comparison-card";
import ComparisonHelp from "@/features/analysis/components/comparison-help";
import { ComparisonBehaviors } from "@/features/analysis/components/comparison-behaviors";
import { ProtocolRecordView } from "@/features/reports/components/protocol-record-view";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { Report, StudentSnapshot, useStudentReports } from "@/features/reports/hooks/use-student-reports";
import { exportReports } from "@/features/reports/utils/export-report";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BarChart3 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";

/** Formats an ISO date as a Brazilian short date. */
function fmtDate(val: string | Date | null | undefined) {
  if (!val) return "";  
  if (val instanceof Date) {
    const day = String(val.getDate()).padStart(2, "0");
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const [year, month, day] = val.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

/** Returns date at local 00:00:00 */
const getLocalStartOfDay = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/** Returns date at local 23:59:59.999 */
const getLocalEndOfDay = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

/** Maps a stored support level code to its display label. */
function fmtSupportLevel(
  raw: string | null | undefined,
  t: (key: TranslationKey) => string,
): string | null {
  if (!raw) return null;
  if (raw === "nivel_1") return t("reports.supportLevel1");
  if (raw === "nivel_2") return t("reports.supportLevel2");
  if (raw === "nivel_3") return t("reports.supportLevel3");
  return raw;
}

/** Display config (label key + color) for each observed behavior type. */
const BEHAVIOR_CONFIG: Record<BehaviorType, { labelKey: TranslationKey; color: string }> = {
  stereotypy: { labelKey: "analysis.behaviorChart.stereotypy.legend", color: "#09CDDB" },
  eye_contact_people: { labelKey: "analysis.behaviorChart.eyePeople.legend", color: "#DBBF09" },
  eye_contact_objects: { labelKey: "analysis.behaviorChart.eyeObjects.legend", color: "#A6900A" },
  engagement: { labelKey: "analysis.behaviorChart.engagement.legend", color: "#34C759" },
  escape: { labelKey: "analysis.behaviorChart.escape.legend", color: "#CB30E0" },
  crisis: { labelKey: "analysis.behaviorChart.crisis.legend", color: "#FF383C" },
  unfit: { labelKey: "analysis.behaviorChart.unfit.legend", color: "#FF8A00" },
  preferred_activity: { labelKey: "analysis.behaviorChart.preferred.legend", color: "#1E88E5" },
};

/** Aggregated behavior for a detail card. */
type BehaviorCardData = {
  type: BehaviorType;
  behaviorName: string;
  color: string;
  occurrences: number;
  sessions: string[];
  exercises: string[];
  lastOccurrence: string;
};

/**
 * Aggregates observed-behavior records into the per-behavior detail cards shown
 * in the analysis screen, so the report can render the same breakdown.
 */
function aggregateBehaviorDetails(
  records: BehaviorRecord[],
  exercises: Record<string, string[]>,
  t: (key: TranslationKey) => string,
): BehaviorCardData[] {
  const keys: BehaviorType[] = [
    "stereotypy", "eye_contact_people", "eye_contact_objects", "engagement",
    "escape", "crisis", "unfit", "preferred_activity",
  ];
  const result: BehaviorCardData[] = [];
  keys.forEach((key) => {
    const recs = records.filter((r) => r.behaviorType === key);
    if (!recs.length) return;
    const occurrences = recs.reduce((sum, r) => sum + r.frequency, 0);
    const uniqueDates = Array.from(new Set(recs.map((r) => r.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    const sessions = uniqueDates.map((dateStr, index) => {
      const [, month, day] = dateStr.split("-").map(Number);
      return `${index + 1}. ${t("analysis.behaviorsScreen.sessionOf")} ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
    });
    const [ly, lm, ld] = uniqueDates[0].split("-").map(Number);
    const lastOccurrence = `${String(ld).padStart(2, "0")}/${String(lm).padStart(2, "0")}/${ly}`;
    result.push({
      type: key,
      behaviorName: t(BEHAVIOR_CONFIG[key].labelKey),
      color: BEHAVIOR_CONFIG[key].color,
      occurrences,
      sessions,
      exercises: exercises[key] ?? [],
      lastOccurrence,
    });
  });
  return result.sort((a, b) => b.occurrences - a.occurrences);
}

/** Bold section title with a bottom divider. */
function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-3 mt-6 pb-2" style={{ borderBottomWidth: 2, borderBottomColor: colors.outline }}>
      <Text className="text-base font-bold text-content" style={{ fontFamily: "Inter-Bold" }}>
        {title}
      </Text>
    </View>
  );
}

/** Placeholder card shown when a report section has no data. */
function EmptySection({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-8 border border-outline rounded-xl bg-level2">
      <View className="w-14 h-14 rounded-full border-2 items-center justify-center mb-3" style={{ borderColor: colors.muted }}>
        <BarChart3 size={28} color={colors.muted} strokeWidth={1.5} />
      </View>
      <Text className="text-sm text-muted text-center px-6">{message}</Text>
    </View>
  );
}

/**
 * Detailed report view for a date range: student info, exercise progress, help
 * records, observed behaviors, period comparison, applied protocols, and motor
 * development records. Supports exporting (PDF/CSV) and deleting the report.
 */
export function ReportDetailScreen() {
  const params = useLocalSearchParams<{
    studentId: string;
    reportId: string;
    titulo: string;
    dataInicio: string;
    dataFim: string;
    snapshotAluno: string;
    imagemUrl: string;
  }>();

  const router = useRouter();
  const { t, locale } = useI18n();
  const { studentId, reportId, titulo, dataInicio, dataFim } = params;
  const imagemUrl = params.imagemUrl || null;
  const snapshot: StudentSnapshot | null = params.snapshotAluno
    ? JSON.parse(params.snapshotAluno)
    : null;

  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "reports";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);

  const { profile: liveProfile } = useStudentProfile(snapshot ? undefined : (studentId ?? ""), { mock: isTutorial });
  const { data, isLoading } = useReportData(studentId ?? "", dataInicio ?? "", dataFim ?? "", { mock: isTutorial });
  const { deleteReport } = useStudentReports(studentId ?? "", { mock: isTutorial });

  const startDate = dataInicio ? getLocalStartOfDay(dataInicio) : null;
  const endDate = dataFim ? getLocalEndOfDay(dataFim) : null;

  // Per-behavior detail (occurrences, sessions, exercises) for the detail cards,
  // matching the observed-behaviors analysis screen.
  const { records: behaviorRecords, exercises: behaviorExercises } = useObservedBehaviors(
    studentId ?? "",
    startDate,
    endDate,
    { mock: isTutorial },
  );
  const behaviorDetailCards = useMemo(
    () => aggregateBehaviorDetails(behaviorRecords, behaviorExercises, t),
    [behaviorRecords, behaviorExercises, t],
  );

  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; mode: "success" | "error"; title: string; description?: string }>({ visible: false, mode: "success", title: "" });

  const currentReport: Report = {
    id: reportId ?? "",
    aluno_id: studentId ?? "",
    titulo: titulo ?? "",
    data_inicio: dataInicio ?? "",
    data_fim: dataFim ?? "",
    snapshot_aluno: snapshot,
    imagem_id: null,
    imagem_url: imagemUrl,
    created_at: "",
  };

  const handleExport = async (
    formats: { pdf: boolean; csv: boolean },
    deliveryMode: "share" | "download" = "share",
  ) => {
    setIsFormatPickerOpen(false);
    if (isTutorial) {
      sim.complete("exportConfirm");
      setToast({
        visible: true,
        mode: "success",
        title: deliveryMode === "download" ? t("reports.downloaded") : t("reports.exported"),
        description: t("reports.simulationNoServer"),
      });
      return;
    }
    try {
      setExporting(true);
      await exportReports([currentReport], formats, titulo ?? "", studentId ?? "", t, locale, deliveryMode);
      setToast({ visible: true, mode: "success", title: t("reports.exported") });
    } catch (err: any) {
      setToast({ visible: true, mode: "error", title: t("reports.exportError"), description: err?.message });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteOpen(false);
    try {
      await deleteReport(reportId ?? "");
      router.back();
    } catch {
      setToast({ visible: true, mode: "error", title: t("reports.deleteError") });
    }
  };

  const buildSummaryCards = () => {
    if (!data?.comparacao) return [];
    const c = data.comparacao;
    const exerciciosP1 = (c.exercicios ?? []).filter((e: any) => e.nivel_p1).length;
    const exerciciosP2 = (c.exercicios ?? []).filter((e: any) => e.nivel_p2).length;
    const ajudaP1 = (c.ajuda?.autonomo?.p1 ?? 0) + (c.ajuda?.ajuda_intrusiva?.p1 ?? 0);
    const ajudaP2 = (c.ajuda?.autonomo?.p2 ?? 0) + (c.ajuda?.ajuda_intrusiva?.p2 ?? 0);
    const compKeys = Object.keys(c.comportamentos ?? {});
    const comportamentosP1 = compKeys.reduce((sum, k) => sum + (c.comportamentos[k]?.p1 ?? 0), 0);
    const comportamentosP2 = compKeys.reduce((sum, k) => sum + (c.comportamentos[k]?.p2 ?? 0), 0);

    const p1 = t("analysis.period1");
    const p2 = t("analysis.period2");
    return [
      { title: t("analysis.summary.exercisesEvaluated"), period1: { label: p1, value: exerciciosP1 }, period2: { label: p2, value: exerciciosP2 } },
      { title: t("analysis.summary.helpRecords"), period1: { label: p1, value: ajudaP1 }, period2: { label: p2, value: ajudaP2 } },
      { title: t("analysis.summary.behaviors"), period1: { label: p1, value: comportamentosP1 }, period2: { label: p2, value: comportamentosP2 } },
      { title: t("analysis.summary.sessions"), period1: { label: p1, value: c.resumo?.sessoes_p1 ?? 0 }, period2: { label: p2, value: c.resumo?.sessoes_p2 ?? 0 } },
    ];
  };

  const hasProtocols = data?.consolidado &&
    ((data.consolidado.historico_cars?.length ?? 0) + (data.consolidado.historico_ata?.length ?? 0) + (data.consolidado.historico_mabc2?.length ?? 0) > 0);

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => {
          if (isTutorial) sim.complete("backFromReport");
          router.back();
        }}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
        backSpotlightKey={isTutorial ? "backFromReport" : undefined}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}>
        <View className="mx-6 mt-4">
          <PageHeader
            mode="relatorio-detalhe"
            title={titulo ?? ""}
            subtitle={dataInicio && dataFim ? `${fmtDate(dataInicio)} – ${fmtDate(dataFim)}` : ""}
            onExportPress={() => {
              if (isTutorial) sim.complete("exportReport");
              setIsFormatPickerOpen(true);
            }}
            exportSpotlightKey={isTutorial ? "exportReport" : undefined}
            onDeletePress={() => setIsDeleteOpen(true)}
          />

          {snapshot ? (
            <View className="mt-4">
              <StudentInfoCard
                name={snapshot.nome_completo} avatarUrl={imagemUrl}
                height={snapshot.altura} weight={snapshot.peso} waist={snapshot.cintura}
                birthDate={snapshot.data_nascimento} supportLevel={fmtSupportLevel(snapshot.nivel_suporte, t)}
                observations={snapshot.observacoes_clinicas}
              />
            </View>
          ) : liveProfile ? (
            <View className="mt-4">
              <StudentInfoCard
                name={liveProfile.name} avatarUrl={liveProfile.avatarUrl}
                height={liveProfile.height} weight={liveProfile.weight} waist={liveProfile.waist}
                birthDate={liveProfile.birthDate} supportLevel={liveProfile.supportLevel}
                observations={liveProfile.observations}
              />
            </View>
          ) : null}

          {isLoading ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : data ? (
            <>
              <SectionHeader title={t("reports.section.progress")} />
              {data.progresso && data.progresso.length > 0 ? (
                data.progresso.map((ex: any) => {
                  const records: ExerciseProgressRecord[] = (ex.historico ?? []).map((h: any, i: number) => ({
                    id: `${ex.exercicio_id}-${i}`,
                    sessionId: `s-${i}`,
                    date: fmtDate(h.data),
                    rawDate: h.data,
                    executionStatus: "realizada" as const,
                    developmentLevel: h.nivel_desenvolvimento,
                  }));
                  if (!records.length) return null;
                  return (
                    <View key={ex.exercicio_id} className="mb-4">
                      <ExerciseProgressChart
                        exerciseName={ex.nome}
                        records={records}
                        startDate={startDate}
                        endDate={endDate}
                        hideShadow
                      />
                    </View>
                  );
                })
              ) : (
                <EmptySection message={t("reports.empty.progress")} />
              )}

              <SectionHeader title={t("reports.section.help")} />
              {data.ajuda && data.ajuda.length > 0 ? (
                <>
                  <HelpRecordsBarChart
                    sessions={data.ajuda.map((s: any, i: number): HelpSessionRecord => ({
                      sessionId: s.sessao_id ?? `s-${i}`,
                      sessionLabel: String(i + 1),
                      intrusiveCount: s.ajuda_intrusiva ?? 0,
                      autonomousCount: s.autonomo ?? 0,
                    }))}
                  />
                  <HelpRecordsDetailModal
                    studentId={studentId}
                    startDate={dataInicio ? dataInicio.split("T")[0] : null}
                    endDate={dataFim ? dataFim.split("T")[0] : null}
                  />
                </>
              ) : (
                <EmptySection message={t("reports.empty.help")} />
              )}

              <SectionHeader title={t("reports.section.behaviors")} />
              {data.comportamentos && data.comportamentos.length > 0 ? (
                <>
                  <ObservedBehaviorsChart
                    records={data.comportamentos as BehaviorRecord[]}
                    startDate={startDate}
                    endDate={endDate}
                    hideShadow
                  />
                  {behaviorDetailCards.length > 0 && (
                    <View className="mt-4 gap-4">
                      {behaviorDetailCards.map((item) => (
                        <BehaviorDetailCard
                          key={item.type}
                          behaviorName={item.behaviorName}
                          color={item.color}
                          occurrences={item.occurrences}
                          sessions={item.sessions}
                          exercises={item.exercises}
                          lastOccurrence={item.lastOccurrence}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <EmptySection message={t("reports.empty.behaviors")} />
              )}

              <SectionHeader title={t("reports.section.comparison")} />
              {data.comparacao ? (
                <View className="gap-4">
                  <AnalysisSummary cards={buildSummaryCards()} />

                  {data.comparacao.exercicios?.length > 0 && (
                    <ExerciseComparisonCard
                      exercicios={data.comparacao.exercicios.filter((e: any) => e.nivel_p1 || e.nivel_p2)}
                      hideDropdown
                    />
                  )}

                  <ComparisonHelp data={data.comparacao.ajuda} />

                  <ComparisonBehaviors data={data.comparacao.comportamentos} />
                </View>
              ) : (
                <EmptySection message={t("reports.empty.comparison")} />
              )}

              <SectionHeader title={t("reports.section.protocols")} />
              {hasProtocols ? (
                <View>
                  {(data.consolidado!.historico_cars ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="cars"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                      fallbackScore={item.pontuacao}
                    />
                  ))}
                  {(data.consolidado!.historico_ata ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="ata"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                      fallbackScore={item.pontuacao}
                    />
                  ))}
                  {(data.consolidado!.historico_mabc2 ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="mabc2"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                      fallbackScore={item.pontuacao}
                      fallbackPercentile={item.percentil}
                    />
                  ))}
                </View>
              ) : (
                <EmptySection message={t("reports.empty.protocols")} />
              )}

              <SectionHeader title={t("reports.section.motor")} />
              {data.consolidado?.registros_controle?.length > 0 ? (
                data.consolidado.registros_controle.map((rc: any, idx: number) => (
                  <View key={idx} className="mb-3 border border-outline rounded-lg bg-level2 overflow-hidden">
                    <View className="bg-level1 px-4 py-2 border-b border-outline">
                      <Text className="text-xs font-bold text-content">
                        {fmtDate(rc.data_sessao)} — {rc.monitor ?? t("reports.noMonitor")}
                      </Text>
                    </View>
                    <View className="px-4 py-3">
                      {(rc.respostas ?? []).length > 0 ? (
                        (rc.respostas as any[]).map((r: any, ri: number) => (
                          <View key={ri} className="flex-row py-1.5 border-b border-outline/30">
                            <Text className="text-xs text-muted flex-1 mr-2">{r.pergunta}</Text>
                            <Text className="text-xs text-content font-bold">{r.valor ?? "–"}</Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-xs text-muted">{t("reports.noAnswers")}</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <EmptySection message={t("reports.empty.motor")} />
              )}
            </>
          ) : (
            <View className="items-center justify-center py-16">
              <EmptySection message={t("reports.empty.noData")} />
            </View>
          )}
        </View>
      </ScrollView>

      <AppModal visible={isFormatPickerOpen} transparent animationType="fade" onRequestClose={() => setIsFormatPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center items-center px-6" onPress={() => setIsFormatPickerOpen(false)}>
          <FormatPicker
            onExport={handleExport}
            onClose={() => setIsFormatPickerOpen(false)}
            exportSpotlightKey={isTutorial ? "exportConfirm" : undefined}
          />
        </Pressable>
      </AppModal>

      <ConfirmationModal
        visible={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t("reports.deleteTitle")}
        message={t("reports.deleteMessage")}
      />

      <Toast
        visible={toast.visible}
        mode={toast.mode}
        title={toast.title}
        description={toast.description}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {isTutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => setNoticeOpen(false)}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
    </View>
  );
}

/** Modal content for choosing report export formats (PDF/CSV) and delivery mode. */
function FormatPicker({
  onExport,
  onClose,
  exportSpotlightKey,
}: {
  onExport: (f: { pdf: boolean; csv: boolean }, mode: "share" | "download") => void;
  onClose: () => void;
  /** Tutorial spotlight key for the share/export action. */
  exportSpotlightKey?: string;
}) {
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const [pdf, setPdf] = useState(true);
  const [csv, setCsv] = useState(false);
  const exportRef = useRef<View>(null);

  useEffect(() => {
    if (!exportSpotlightKey) return;
    sim.registerTarget(exportSpotlightKey, exportRef, { rounded: true });
    return () => sim.unregisterTarget(exportSpotlightKey);
  }, [sim, exportSpotlightKey]);

  return (
    <Pressable className="bg-level2 border border-outline rounded-2xl p-6 w-full gap-5" onPress={(e) => e.stopPropagation()}>
      <Text className="text-header-2 text-content">{t("export.selectFormat")}</Text>
      <View className="gap-3">
        <Pressable onPress={() => setPdf((v) => !v)} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded border items-center justify-center ${pdf ? "bg-primary border-primary" : "border-outline bg-transparent"}`}>
            {pdf && <Text className="text-content text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-content text-default-1">{t("export.pdfWithCharts")}</Text>
        </Pressable>
        <Pressable onPress={() => setCsv((v) => !v)} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded border items-center justify-center ${csv ? "bg-primary border-primary" : "border-outline bg-transparent"}`}>
            {csv && <Text className="text-content text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-content text-default-1">{t("export.csvTabular")}</Text>
        </Pressable>
      </View>
      <View className="gap-3">
        <View className="flex-row gap-3">
          <DefaultButton label={t("common.cancel")} onPress={onClose} bgColorClass="bg-level1" shadowClass="" sizeClass="flex-1 h-11" className="border border-outline" textClassName="text-muted" />
          <View ref={exportRef} collapsable={false} className="flex-1">
            <DefaultButton label={t("export.exportAction")} onPress={() => onExport({ pdf, csv }, "share")} sizeClass="w-full h-11" bgColorClass="bg-primary" hasShadow />
          </View>
        </View>
        {Platform.OS === "android" && (
          <DefaultButton label={t("export.downloadAction")} onPress={() => onExport({ pdf, csv }, "download")} sizeClass="w-full h-11" bgColorClass="bg-secondary" hasShadow={false} className="border border-secondary" textClassName="text-content" />
        )}
      </View>

      <TutorialSpotlight />
    </Pressable>
  );
}

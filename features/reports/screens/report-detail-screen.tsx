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
import { ObservedBehaviorsChart, BehaviorRecord } from "@/features/analysis/components/observed-behaviors-chart";
import { AnalysisSummary } from "@/features/analysis/components/analysis-summary";
import ExerciseComparisonCard from "@/features/analysis/components/exercice-comparison-card";
import ComparisonHelp from "@/features/analysis/components/comparison-help";
import { ComparisonBehaviors } from "@/features/analysis/components/comparison-behaviors";
import { ProtocolRecordView } from "@/features/reports/components/protocol-record-view";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { Report, StudentSnapshot, useStudentReports } from "@/features/reports/hooks/use-student-reports";
import { exportReports } from "@/features/reports/utils/export-report";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BarChart3 } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";

/** Formats an ISO date as a Brazilian short date. */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Maps a stored support level code to its display label. */
function fmtSupportLevel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw === "nivel_1") return "Nível 1";
  if (raw === "nivel_2") return "Nível 2";
  if (raw === "nivel_3") return "Nível 3";
  return raw;
}

/** Bold section title with a bottom divider. */
function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-3 mt-6 pb-2" style={{ borderBottomWidth: 2, borderBottomColor: colors.outline }}>
      <Text className="text-base font-bold text-white" style={{ fontFamily: "Inter-Bold" }}>
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
  }>();

  const router = useRouter();
  const { studentId, reportId, titulo, dataInicio, dataFim } = params;
  const snapshot: StudentSnapshot | null = params.snapshotAluno
    ? JSON.parse(params.snapshotAluno)
    : null;

  const { profile: liveProfile } = useStudentProfile(snapshot ? undefined : (studentId ?? ""));
  const { data, isLoading } = useReportData(studentId ?? "", dataInicio ?? "", dataFim ?? "");
  const { deleteReport } = useStudentReports(studentId ?? "");

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
    created_at: "",
  };

  const handleExport = async (
    formats: { pdf: boolean; csv: boolean },
    deliveryMode: "share" | "download" = "share",
  ) => {
    setIsFormatPickerOpen(false);
    try {
      setExporting(true);
      await exportReports([currentReport], formats, titulo ?? "", studentId ?? "", deliveryMode);
      setToast({ visible: true, mode: "success", title: "Relatório exportado!" });
    } catch (err: any) {
      setToast({ visible: true, mode: "error", title: "Erro ao exportar", description: err?.message });
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
      setToast({ visible: true, mode: "error", title: "Erro ao excluir relatório." });
    }
  };

  const startDate = dataInicio ? new Date(dataInicio) : null;
  const endDate = dataFim ? new Date(dataFim) : null;

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

    return [
      { title: "Exercícios avaliados", period1: { label: "Período 1", value: exerciciosP1 }, period2: { label: "Período 2", value: exerciciosP2 } },
      { title: "Registros de ajuda", period1: { label: "Período 1", value: ajudaP1 }, period2: { label: "Período 2", value: ajudaP2 } },
      { title: "Comportamentos observados", period1: { label: "Período 1", value: comportamentosP1 }, period2: { label: "Período 2", value: comportamentosP2 } },
      { title: "Sessões registradas", period1: { label: "Período 1", value: c.resumo?.sessoes_p1 ?? 0 }, period2: { label: "Período 2", value: c.resumo?.sessoes_p2 ?? 0 } },
    ];
  };

  const hasProtocols = data?.consolidado &&
    ((data.consolidado.historico_cars?.length ?? 0) + (data.consolidado.historico_ata?.length ?? 0) + (data.consolidado.historico_mabc2?.length ?? 0) > 0);

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}>
        <View className="mx-6 mt-4">
          <PageHeader
            mode="relatorio-detalhe"
            title={titulo ?? ""}
            subtitle={dataInicio && dataFim ? `${fmtDate(dataInicio)} – ${fmtDate(dataFim)}` : ""}
            onExportPress={() => setIsFormatPickerOpen(true)}
            onDeletePress={() => setIsDeleteOpen(true)}
          />

          {snapshot ? (
            <View className="mt-4">
              <StudentInfoCard
                name={snapshot.nome_completo} avatarUrl={null}
                height={snapshot.altura} weight={snapshot.peso} waist={snapshot.cintura}
                birthDate={snapshot.data_nascimento} supportLevel={fmtSupportLevel(snapshot.nivel_suporte)}
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
              <SectionHeader title="Progresso por exercício" />
              {data.progresso && data.progresso.length > 0 ? (
                data.progresso.map((ex: any) => {
                  const records: ExerciseProgressRecord[] = (ex.historico ?? []).map((h: any, i: number) => ({
                    id: `${ex.exercicio_id}-${i}`,
                    sessionId: `s-${i}`,
                    date: new Date(h.data).toLocaleDateString("pt-BR"),
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
                <EmptySection message="Nenhum exercício registrado no período." />
              )}

              <SectionHeader title="Registros de ajuda por sessão" />
              {data.ajuda && data.ajuda.length > 0 ? (
                <HelpRecordsBarChart
                  sessions={data.ajuda.map((s: any, i: number): HelpSessionRecord => ({
                    sessionId: s.sessao_id ?? `s-${i}`,
                    sessionLabel: String(i + 1),
                    intrusiveCount: s.ajuda_intrusiva ?? 0,
                    autonomousCount: s.autonomo ?? 0,
                  }))}
                />
              ) : (
                <EmptySection message="Nenhum registro de ajuda no período." />
              )}

              <SectionHeader title="Comportamentos observados" />
              {data.comportamentos && data.comportamentos.length > 0 ? (
                <ObservedBehaviorsChart
                  records={data.comportamentos as BehaviorRecord[]}
                  startDate={startDate}
                  endDate={endDate}
                  hideShadow
                />
              ) : (
                <EmptySection message="Nenhum comportamento registrado no período." />
              )}

              <SectionHeader title="Comparação de desempenho" />
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
                <EmptySection message="Dados insuficientes para comparação no período." />
              )}

              <SectionHeader title="Protocolos/Testes aplicados" />
              {hasProtocols ? (
                <View>
                  {(data.consolidado!.historico_cars ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="cars"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                    />
                  ))}
                  {(data.consolidado!.historico_ata ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="ata"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                    />
                  ))}
                  {(data.consolidado!.historico_mabc2 ?? []).map((item: any) => (
                    <ProtocolRecordView
                      key={item.id}
                      tipo="mabc2"
                      recordId={item.id}
                      dateLabel={fmtDate(item.data)}
                      responsavel={item.responsavel}
                    />
                  ))}
                </View>
              ) : (
                <EmptySection message="Nenhum protocolo ou teste aplicado no período." />
              )}

              <SectionHeader title="Desenvolvimento motor" />
              {data.consolidado?.registros_controle?.length > 0 ? (
                data.consolidado.registros_controle.map((rc: any, idx: number) => (
                  <View key={idx} className="mb-3 border border-outline rounded-lg bg-level2 overflow-hidden">
                    <View className="bg-level1 px-4 py-2 border-b border-outline">
                      <Text className="text-xs font-bold text-white">
                        {fmtDate(rc.data_sessao)} — {rc.monitor ?? "Sem monitor"}
                      </Text>
                    </View>
                    <View className="px-4 py-3">
                      {(rc.respostas ?? []).length > 0 ? (
                        (rc.respostas as any[]).map((r: any, ri: number) => (
                          <View key={ri} className="flex-row py-1.5 border-b border-outline/30">
                            <Text className="text-xs text-muted flex-1 mr-2">{r.pergunta}</Text>
                            <Text className="text-xs text-white font-bold">{r.valor ?? "–"}</Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-xs text-muted">Sem respostas registradas.</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <EmptySection message="Nenhum registro de desenvolvimento motor no período." />
              )}
            </>
          ) : (
            <View className="items-center justify-center py-16">
              <EmptySection message="Nenhum dado encontrado para este período." />
            </View>
          )}
        </View>
      </ScrollView>

      <AppModal visible={isFormatPickerOpen} transparent animationType="fade" onRequestClose={() => setIsFormatPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center items-center px-6" onPress={() => setIsFormatPickerOpen(false)}>
          <FormatPicker onExport={handleExport} onClose={() => setIsFormatPickerOpen(false)} />
        </Pressable>
      </AppModal>

      <ConfirmationModal
        visible={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir relatório?"
        message="O relatório será excluído permanentemente. Esta ação não poderá ser desfeita."
      />

      <Toast
        visible={toast.visible}
        mode={toast.mode}
        title={toast.title}
        description={toast.description}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}

/** Modal content for choosing report export formats (PDF/CSV) and delivery mode. */
function FormatPicker({ onExport, onClose }: { onExport: (f: { pdf: boolean; csv: boolean }, mode: "share" | "download") => void; onClose: () => void }) {
  const [pdf, setPdf] = useState(true);
  const [csv, setCsv] = useState(false);
  return (
    <Pressable className="bg-level2 border border-outline rounded-2xl p-6 w-full gap-5" onPress={(e) => e.stopPropagation()}>
      <Text className="text-header-2 text-white">Selecionar formato</Text>
      <View className="gap-3">
        <Pressable onPress={() => setPdf((v) => !v)} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded border items-center justify-center ${pdf ? "bg-primary border-primary" : "border-outline bg-transparent"}`}>
            {pdf && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-white text-default-1">PDF (com gráficos)</Text>
        </Pressable>
        <Pressable onPress={() => setCsv((v) => !v)} className="flex-row items-center gap-3">
          <View className={`w-5 h-5 rounded border items-center justify-center ${csv ? "bg-primary border-primary" : "border-outline bg-transparent"}`}>
            {csv && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-white text-default-1">CSV (dados tabulares)</Text>
        </Pressable>
      </View>
      <View className="gap-3">
        <View className="flex-row gap-3">
          <DefaultButton label="Cancelar" onPress={onClose} bgColorClass="bg-level1" shadowClass="" sizeClass="flex-1 h-11" className="border border-outline" textClassName="text-muted" />
          <DefaultButton label="Exportar" onPress={() => onExport({ pdf, csv }, "share")} sizeClass="flex-1 h-11" bgColorClass="bg-primary" hasShadow />
        </View>
        {Platform.OS === "android" && (
          <DefaultButton label="Baixar" onPress={() => onExport({ pdf, csv }, "download")} sizeClass="w-full h-11" bgColorClass="bg-secondary" hasShadow={false} className="border border-secondary" textClassName="text-white" />
        )}
      </View>
    </Pressable>
  );
}

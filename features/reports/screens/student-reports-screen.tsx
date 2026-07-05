import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DataList } from "@/components/data-list";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { Toast } from "@/components/toast";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { NewReport } from "@/features/reports/components/new-report";
import { Report, ReportFormData, useStudentReports } from "@/features/reports/hooks/use-student-reports";
import { exportReports } from "@/features/reports/utils/export-report";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import RangeCalendar from "@/components/range-calendar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, X } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/** Modal for choosing export formats (PDF/CSV) and, on Android, the delivery mode. */
function FormatPicker({
  visible,
  onClose,
  onExport,
}: {
  visible: boolean;
  onClose: () => void;
  onExport: (formats: { pdf: boolean; csv: boolean }, mode: "share" | "download") => void;
}) {
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
          <Text className="text-header-2 text-content">Selecionar formato</Text>

          <View className="gap-3">
            <Pressable onPress={() => setPdf((v) => !v)} className="flex-row items-center gap-3">
              <View
                className={`w-5 h-5 rounded border items-center justify-center ${
                  pdf ? "bg-primary border-primary" : "border-outline bg-transparent"
                }`}
              >
                {pdf && <Text className="text-content text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-content text-default-1">PDF (com gráficos)</Text>
            </Pressable>
            <Pressable onPress={() => setCsv((v) => !v)} className="flex-row items-center gap-3">
              <View
                className={`w-5 h-5 rounded border items-center justify-center ${
                  csv ? "bg-primary border-primary" : "border-outline bg-transparent"
                }`}
              >
                {csv && <Text className="text-content text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-content text-default-1">CSV (dados tabulares)</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-3">
              <DefaultButton
                label="Cancelar"
                onPress={onClose}
                bgColorClass="bg-level1"
                shadowClass=""
                sizeClass="flex-1 h-11"
                className="border border-outline"
                textClassName="text-muted"
              />
              <DefaultButton
                label="Exportar"
                onPress={() => onExport({ pdf, csv }, "share")}
                sizeClass="flex-1 h-11"
                bgColorClass="bg-primary"
                hasShadow
              />
            </View>

            {Platform.OS === "android" && (
              <DefaultButton
                label="Baixar"
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

/** Modal for renaming a report. */
function RenameModal({
  visible,
  currentName,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  React.useEffect(() => {
    if (visible) setName(currentName);
  }, [visible, currentName]);

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center px-6"
        onPress={onClose}
      >
        <Pressable
          className="bg-level2 border border-outline rounded-2xl p-6 w-full gap-4"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-header-2 text-content">Renomear relatório</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X color={colors.muted} size={22} />
            </Pressable>
          </View>
          <DefaultTextInput
            placeholder="Nome do relatório"
            value={name}
            onChangeText={setName}
          />
          <Pressable
            onPress={() => { if (name.trim()) onSave(name.trim()); }}
            disabled={!name.trim()}
            className={`w-full h-11 items-center justify-center rounded-2xl active:opacity-70 ${name.trim() ? "bg-primary" : "bg-muted/30"}`}
          >
            <Text 
              className="text-content text-base font-bold" 
              style={{ fontFamily: "Inter-Bold", opacity: name.trim() ? 1 : 0.5 }}
            >
              Salvar
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}

/** Formats an ISO date as a Brazilian `DD/MM/YYYY` string. */
function formatDateBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formats a date range, collapsing equal start/end into a single date. */
function formatDateRange(start: string, end: string): string {
  return start === end ? formatDateBR(start) : `${formatDateBR(start)} – ${formatDateBR(end)}`;
}

/**
 * Screen listing a student's reports with period filtering, creation, rename,
 * deletion, and a multi-select batch export flow (PDF/CSV).
 */
export function StudentReportsScreen() {
  const router = useRouter();
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "reports";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const newButtonRef = useRef<View>(null);

  const { reports, isLoading, refresh, createReport, renameReport, deleteReport } =
    useStudentReports(studentId ?? "", { mock: isTutorial });

  const [isNewOpen, setIsNewOpen] = useState(false);

  const [renamingReport, setRenamingReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStart, setFilterStart] = useState<string | null>(null);
  const [filterEnd, setFilterEnd] = useState<string | null>(null);
  const [tempFilterStart, setTempFilterStart] = useState<string | null>(null);
  const [tempFilterEnd, setTempFilterEnd] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    visible: boolean;
    mode: "success" | "error";
    title: string;
    description?: string;
  }>({ visible: false, mode: "success", title: "" });

  const showToast = (mode: "success" | "error", title: string, description?: string) =>
    setToast({ visible: true, mode, title, description });

  /** The report created during the guided simulation (spotlight target). */
  const createdReport = isTutorial
    ? reports.find((r) => r.id.startsWith("mock-new-report-"))
    : undefined;

  React.useEffect(() => {
    if (!isTutorial) return;
    sim.registerTarget("newReport", newButtonRef, { rounded: true });
    return () => sim.unregisterTarget("newReport");
  }, [isTutorial, sim]);

  const openFilterCalendar = () => {
    setTempFilterStart(filterStart);
    setTempFilterEnd(filterEnd);
    setIsFilterOpen(true);
  };

  const saveFilter = () => {
    if (!tempFilterStart || !tempFilterEnd) return;
    setFilterStart(tempFilterStart);
    setFilterEnd(tempFilterEnd);
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    setFilterStart(null);
    setFilterEnd(null);
  };

  const filteredReports = useMemo(() => {
    if (!filterStart || !filterEnd) return reports;
    const fs = new Date(filterStart).getTime();
    const fe = new Date(filterEnd).getTime() + 86400000;
    return reports.filter((r) => {
      const rs = new Date(r.data_inicio).getTime();
      const re = new Date(r.data_fim).getTime();
      return rs <= fe && re >= fs;
    });
  }, [reports, filterStart, filterEnd]);

  const toggleExportMode = () => {
    setIsExportMode((v) => !v);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmExport = () => {
    if (!selectedIds.length) {
      showToast("error", "Nenhum relatório selecionado", "Selecione ao menos um relatório para exportar.");
      return;
    }
    setIsFormatPickerOpen(true);
  };

  const handleExport = async (
    formats: { pdf: boolean; csv: boolean },
    deliveryMode: "share" | "download" = "share",
  ) => {
    setIsFormatPickerOpen(false);
    if (isTutorial) {
      showToast(
        "success",
        deliveryMode === "download" ? "Relatório baixado!" : "Relatório exportado!",
        "Simulação: nada foi enviado ao servidor.",
      );
      setIsExportMode(false);
      setSelectedIds([]);
      sim.complete("exportReport");
      return;
    }
    const selected = reports.filter((r) => selectedIds.includes(r.id));
    try {
      setExporting(true);
      await exportReports(selected, formats, studentName ?? "", studentId ?? "", deliveryMode);
      showToast(
        "success",
        deliveryMode === "download" ? "Relatório baixado!" : "Relatório salvo!",
        deliveryMode === "download"
          ? `O relatório de ${studentName} foi baixado no dispositivo.`
          : `O relatório de ${studentName} foi exportado e encaminhado ao compartilhamento.`
      );
      setIsExportMode(false);
      setSelectedIds([]);
    } catch (err: any) {
      showToast("error", "Erro ao exportar", err?.message ?? "Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = async (data: ReportFormData) => {
    await createReport(data);
    showToast("success", "Relatório criado!");
    if (isTutorial) sim.complete("saveReport");
  };

  const handleRename = async (newName: string) => {
    if (!renamingReport) return;
    try {
      await renameReport(renamingReport.id, newName);
      showToast("success", "Relatório renomeado.");
    } catch {
      showToast("error", "Erro ao renomear.");
    }
    setRenamingReport(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      showToast("success", "Relatório removido.");
    } catch {
      showToast("error", "Erro ao remover relatório.");
    }
  };

  const openReport = (report: Report) => {
    if (isTutorial) sim.complete("openReport");
    router.push({
      pathname: "/report-detail",
      params: {
        studentId: studentId ?? "",
        reportId: report.id,
        titulo: report.titulo,
        dataInicio: report.data_inicio,
        dataFim: report.data_fim,
        snapshotAluno: report.snapshot_aluno ? JSON.stringify(report.snapshot_aluno) : "",
        imagemUrl: report.imagem_url ?? "",
      },
    } as any);
  };

  const n = filteredReports.length;
  const filterLabel = filterStart && filterEnd
    ? `${formatDateBR(filterStart)} – ${formatDateBR(filterEnd)}`
    : undefined;

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => router.back()}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
      />

      <View className="flex-1 mx-8">
        <View className="mt-5 w-full">
          <PageHeader
            mode="relatorios-aluno"
            title={studentName ?? ""}
            subtitle={`${n} ${n === 1 ? "relatório" : "relatórios"}`}
            newButtonRef={isTutorial ? newButtonRef : undefined}
            onExportPress={toggleExportMode}
            isExportActive={isExportMode}
            onNewPress={() => {
              if (isExportMode) return;
              if (isTutorial) sim.complete("newReport");
              setIsNewOpen(true);
            }}
          />
        </View>

        <View className="mt-2 w-full">
          <PeriodSelector
            label={filterLabel ?? "Filtrar por período"}
            onPress={openFilterCalendar}
            containerStyle={{ marginHorizontal: 0 }}
          />
          {filterLabel && (
            <Pressable onPress={clearFilter} className="items-end mt-1" hitSlop={8}>
              <Text className="text-xs text-muted">Limpar filtro</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-3 flex-1">
            <DataList
              data={filteredReports}
              keyExtractor={(item) => item.id}
              emptyMessage="Nenhum relatório cadastrado."
              contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
              onRefresh={refresh}
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item.id);
                const card = (
                  <ListCard
                    title={item.titulo}
                    subtitle={formatDateRange(item.data_inicio, item.data_fim)}
                    icon={<FileText size={18} color={colors.muted} />}
                    rightAction={isExportMode ? "none" : "more"}
                    editLabel="Renomear"
                    onEdit={!isExportMode ? () => setRenamingReport(item) : undefined}
                    onDelete={!isExportMode ? () => setReportToDelete(item) : undefined}
                    enableRipple
                    onPress={isExportMode ? () => toggleSelect(item.id) : () => openReport(item)}
                    className={isSelected ? "border border-primary" : undefined}
                  />
                );
                return isTutorial && !isExportMode && item.id === createdReport?.id ? (
                  <SpotlightTarget targetKey="openReport">{card}</SpotlightTarget>
                ) : (
                  card
                );
              }}
            />
          </View>
        )}

        {isExportMode && (
          <View className="absolute bottom-8 left-0 right-0 flex-row gap-4">
            <DefaultButton
              label={`Cancelar`}
              onPress={toggleExportMode}
              bgColorClass="bg-error"
              sizeClass="flex-1 h-11"
              shadowClass="shadow-errorShadow"
            />
            <DefaultButton
              label={`Confirmar (${selectedIds.length})`}
              onPress={handleConfirmExport}
              bgColorClass="bg-primary"
              sizeClass="flex-1 h-11"
              />
          </View>
        )}
      </View>

      <NewReport
        visible={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSave={handleCreate}
        defaultTitle={`Relatório ${reports.length + 1}`}
      />

      <RenameModal
        visible={!!renamingReport}
        currentName={renamingReport?.titulo ?? ""}
        onClose={() => setRenamingReport(null)}
        onSave={handleRename}
      />

      <FormatPicker
        visible={isFormatPickerOpen}
        onClose={() => setIsFormatPickerOpen(false)}
        onExport={handleExport}
      />

      <AppModal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsFilterOpen(false)}
        >
          <Pressable
            className="w-full max-w-[380px]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-full mb-4">
              <RangeCalendar
                key={`filter-${isFilterOpen}`}
                onRangeSelected={(start, end) => {
                  setTempFilterStart(start);
                  setTempFilterEnd(end);
                }}
              />
            </View>
            <View className="items-center">
              <DefaultButton
                label="Salvar"
                sizeClass="w-full h-11"
                disabled={!tempFilterStart || !tempFilterEnd}
                style={{ opacity: !tempFilterStart || !tempFilterEnd ? 0.5 : 1 }}
                onPress={saveFilter}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      <ConfirmationModal
        visible={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={() => {
          if (reportToDelete) {
            handleDelete(reportToDelete.id);
          }
          setReportToDelete(null);
        }}
        title="Excluir relatório?"
        message="O relatório será excluído permanentemente. Esta ação não poderá ser desfeita."
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
          onExit={() => { setNoticeOpen(false); router.back(); }}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
    </View>
  );
}

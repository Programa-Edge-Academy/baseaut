import { ActionButtons } from "@/components/action-buttons";
import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import RangeCalendar from "@/components/range-calendar";
import { Report, ReportFormData } from "@/features/reports/hooks/use-student-reports";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

/** Props for {@link NewReport}. */
export type NewReportProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ReportFormData) => Promise<void>;
  /** When provided, the modal opens in edit mode pre-filled with this report. */
  initialData?: Report | null;
  /** Default title used when creating a new report. */
  defaultTitle?: string;
};

/**
 * Modal for creating or editing a report: sets its title and date range (via a
 * range calendar) before saving.
 */
export function NewReport({ visible, onClose, onSave, initialData, defaultTitle }: NewReportProps) {
  const { width, height } = useWindowDimensions();
  const isEdit = !!initialData;

  const [titulo, setTitulo] = useState("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempInicio, setTempInicio] = useState<string>("");
  const [tempFim, setTempFim] = useState<string>("");

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitulo(initialData.titulo);
        setDataInicio(initialData.data_inicio);
        setDataFim(initialData.data_fim);
      } else {
        setTitulo(defaultTitle ?? "");
        setDataInicio("");
        setDataFim("");
      }
      setSaving(false);
      setErrors({});
    }
  }, [visible, initialData, defaultTitle]);

  const openCalendar = () => {
    setTempInicio(dataInicio);
    setTempFim(dataFim);
    setIsCalendarOpen(true);
  };

  const savePeriod = () => {
    if (!tempInicio || !tempFim) return;
    setDataInicio(tempInicio);
    setDataFim(tempFim);
    setIsCalendarOpen(false);
    if (errors.periodo) setErrors((prev) => ({ ...prev, periodo: "" }));
  };

  const periodLabel = dataInicio
    ? dataFim && dataFim !== dataInicio
      ? `${dataInicio} → ${dataFim}`
      : dataInicio
    : undefined;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) newErrors.titulo = "Nome do relatório é obrigatório.";
    if (!dataInicio) newErrors.periodo = "Selecione o período do relatório.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await onSave({
        titulo: titulo.trim(),
        data_inicio: dataInicio,
        data_fim: dataFim || dataInicio,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppModal visible={visible} onRequestClose={onClose} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center">
          <View
            className="border bg-level2 border-outline"
            style={{
              borderRadius: 15,
              marginHorizontal: width * 0.04,
              maxHeight: height * 0.75,
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: 24, gap: 18 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-white">
                  {isEdit ? "Editar relatório" : "Novo relatório"}
                </Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <X color={colors.muted} size={24} />
                </Pressable>
              </View>

              <View className="gap-1">
                <Text className="text-default-2 text-muted">Nome do relatório*</Text>
                <DefaultTextInput
                  placeholder="Nome do relatório"
                  value={titulo}
                  outLineBorderClass={errors.titulo ? "border-error" : "border-outline"}
                  onChangeText={(text: string) => {
                    setTitulo(text);
                    if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: "" }));
                  }}
                />
                {errors.titulo ? (
                  <Text className="mt-1 text-default-3 text-error">{errors.titulo}</Text>
                ) : null}
              </View>

              <View className="gap-1">
                <Text className="text-default-2 text-muted">Período*</Text>
                <PeriodSelector
                  label={periodLabel ?? "Selecionar período"}
                  onPress={openCalendar}
                  containerStyle={{ marginHorizontal: 0 }}
                />
                {errors.periodo ? (
                  <Text className="mt-1 text-default-3 text-error">{errors.periodo}</Text>
                ) : null}
              </View>

              <ActionButtons
                onCancel={onClose}
                onSave={handleSave}
                saveLabel={saving ? "Salvando..." : "Salvar"}
                disabled={saving}
              />
            </ScrollView>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={isCalendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsCalendarOpen(false)}
        >
          <Pressable
            className="w-full max-w-[380px]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-full mb-4">
              <RangeCalendar
                key={`nr-cal-${isCalendarOpen}`}
                mode="range"
                onRangeSelected={(start, end) => {
                  setTempInicio(start);
                  setTempFim(end ?? start);
                }}
              />
            </View>
            <View className="items-center">
              <DefaultButton
                label="Salvar"
                sizeClass="w-[168px] h-[44px]"
                disabled={!tempInicio || !tempFim}
                style={{ opacity: !tempInicio || !tempFim ? 0.5 : 1 }}
                onPress={savePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>
    </>
  );
}

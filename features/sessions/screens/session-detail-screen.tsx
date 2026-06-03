import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import {
  useSessionResult,
  type SessionResultExercise,
} from "../hooks/use-session-result";

const NIVEL_LABEL: Record<string, string> = {
  inicial: "Inicial",
  intermediario: "Intermediário",
  maduro: "Maduro",
};

const AJUDA_LABEL: Record<string, string> = {
  autonomo: "Autônomo",
  ajuda_intrusiva: "Ajuda intrusiva",
  nao_se_aplica: "Não se aplica",
};

const MOTIVO_LABEL: Record<string, string> = {
  recusa_aluno: "Recusa do aluno",
  comportamento_disruptivo: "Comportamento disruptivo",
  fadiga_cansaco: "Fadiga ou cansaço",
  tempo_insuficiente: "Tempo insuficiente",
  dificuldade_fisica: "Dificuldade física",
  outro: "Outro",
};

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function ExerciseDetailCard({ exercise }: { exercise: SessionResultExercise }) {
  const isRealized = exercise.status_realizacao === "realizada";
  const duration = formatDuration(exercise.duracao_real_segundos);

  return (
    <View className="mb-3 rounded-2xl border border-outline bg-level2 p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-white text-default-2 font-medium">
            {exercise.ordem_execucao}. {exercise.titulo}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          {isRealized ? (
            <CheckCircle2 size={18} color={colors.secondary} />
          ) : (
            <XCircle size={18} color={colors.error} />
          )}
          <Text
            className="text-sm font-medium"
            style={{ color: isRealized ? colors.secondary : colors.error }}
          >
            {isRealized ? "Realizada" : "Não realizada"}
          </Text>
        </View>
      </View>

      <View className="mt-3 gap-1">
        {duration && (
          <Text className="text-muted text-sm">Duração: {duration}</Text>
        )}
        {exercise.nivel_desenvolvimento && (
          <Text className="text-muted text-sm">
            Nível: {NIVEL_LABEL[exercise.nivel_desenvolvimento] ?? exercise.nivel_desenvolvimento}
          </Text>
        )}
        {exercise.registro_ajuda && (
          <Text className="text-muted text-sm">
            Ajuda: {AJUDA_LABEL[exercise.registro_ajuda] ?? exercise.registro_ajuda}
            {exercise.complementos_ajuda && exercise.complementos_ajuda.length > 0
              ? ` (${exercise.complementos_ajuda.join(", ")})`
              : ""}
          </Text>
        )}
        {exercise.motivo_nao_realizacao && (
          <Text className="text-muted text-sm">
            Motivo: {MOTIVO_LABEL[exercise.motivo_nao_realizacao] ?? exercise.motivo_nao_realizacao}
          </Text>
        )}
        {exercise.descricao_adicional && (
          <Text className="text-muted text-sm">
            Observação: {exercise.descricao_adicional}
          </Text>
        )}
      </View>
    </View>
  );
}

export type SessionDetailScreenProps = {
  sessionId: string;
  studentName?: string;
};

export function SessionDetailScreen({
  sessionId,
  studentName = "Aluno",
}: SessionDetailScreenProps) {
  const { result, summary, isLoading, error } = useSessionResult(sessionId);
  const exercises = result?.exercicios ?? [];

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" />

      <View className="mx-8 mt-5">
        <PageHeader
          title={`Detalhes - ${studentName}`}
          subtitle={`${summary.realizedCount}/${summary.total} realizadas · ${summary.unrealizedCount} não realizadas`}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="mt-16 items-center px-8">
          <Text className="text-center text-default-2 text-extra">
            {error.message || "Erro ao carregar os detalhes da sessão."}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="mt-5 px-8"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            <Text className="text-center text-muted text-default-2 mt-10">
              Nenhuma execução registrada nesta sessão.
            </Text>
          ) : (
            exercises.map((exercise) => (
              <ExerciseDetailCard key={exercise.id} exercise={exercise} />
            ))
          )}
        </ScrollView>
      )}

      <Footer />
    </View>
  );
}

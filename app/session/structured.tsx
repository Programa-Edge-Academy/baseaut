import React, { useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { SessionRunningScreen } from "../../features/sessions/screens/session-running-screen";
import type { SessionExercise } from "../../features/sessions/screens/session-running-screen";
import {
  useSessionFlow,
  type ExecutionRecord,
  type MotivoFinalizacao,
} from "../../features/sessions/hooks/use-session-flow";

/**
 * Maps the early-finish reason labels to the `motivo_finalizacao_enum`.
 * Reasons without a direct match fall back to "outro" while the label is
 * preserved in `descricao_motivo`.
 */
const MOTIVO_FINALIZACAO_MAP: Record<string, MotivoFinalizacao> = {
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Tempo insuficiente": "tempo_esgotado",
};

export default function SessionEstruturadoRoute() {
  const { studentId, studentName, circuitId, circuitName, exercises } =
    useLocalSearchParams<{
      studentId?: string;
      studentName?: string;
      circuitId?: string;
      circuitName?: string;
      exercises?: string;
    }>();

  const { createSession, saveSession } = useSessionFlow();
  const sessaoIdRef = useRef<string | null>(null);

  // Exercises seeded from the selected circuit (serialized in the route param).
  const sessionExercises = useMemo<SessionExercise[]>(() => {
    try {
      const parsed = JSON.parse(exercises ?? "[]") as {
        id: string;
        name: string;
        description: string;
      }[];
      return parsed.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        mediaUrls: [],
      }));
    } catch {
      return [];
    }
  }, [exercises]);

  // Opens the session row as soon as the screen mounts so executions can be
  // attached to it as the user advances.
  useEffect(() => {
    let active = true;

    (async () => {
      if (!studentId) return;
      try {
        const id = await createSession({
          alunoId: studentId,
          circuitoId: circuitId ?? null,
        });
        if (active) sessaoIdRef.current = id;
      } catch (error: any) {
        Alert.alert(
          "Erro ao iniciar sessão",
          error?.message ?? "Não foi possível abrir a sessão.",
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [studentId, circuitId, createSession]);

  const persistAndContinue = async (
    executions: ExecutionRecord[],
    completedType: "structured" | "structured-warnings" | "structured-continuation",
    finishMotivo?: string,
  ) => {
    const sessaoId = sessaoIdRef.current;

    if (sessaoId) {
      try {
        await saveSession(sessaoId, executions, {
          status: "concluida",
          motivoFinalizacao: finishMotivo
            ? MOTIVO_FINALIZACAO_MAP[finishMotivo] ?? "outro"
            : null,
          descricaoMotivo: finishMotivo ?? null,
        });
      } catch (error: any) {
        Alert.alert(
          "Erro ao salvar sessão",
          error?.message ?? "Não foi possível salvar os registros da sessão.",
        );
      }
    }

    router.push({
      pathname: "/session/completed",
      params: {
        type: completedType,
        sessaoId: sessaoId ?? "",
        studentName: studentName ?? "",
        circuitName: circuitName ?? "",
        executionMode: "estruturado",
      },
    });
  };

  return (
    <SessionRunningScreen
      studentName={studentName || "Aluno"}
      circuitName={circuitName || "Circuito"}
      circuitType={"padrao"}
      exercises={sessionExercises}
      onPressBack={() => router.back()}
      onCompleteSession={(hasWarnings, executions) => {
        persistAndContinue(
          executions,
          hasWarnings ? "structured-warnings" : "structured",
        );
      }}
      // Early finish (e.g. missing exercises) goes to the continuation screen.
      onFinishSession={(motivo, executions) => {
        persistAndContinue(executions, "structured-continuation", motivo);
      }}
    />
  );
}

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import { calculateAge } from "@/lib/date-utils";
import { supabase } from "@/lib/supabase";
import {
  Circuit,
  CircuitType,
  useCircuits,
} from "../features/exercises/hooks/use-circuits";
import {
  CircuitItem,
  CircuitSelectionScreen,
} from "../features/sessions/screens/circuit-selection-screen";
import { useSessionGlobalContext } from "../features/sessions/contexts/session-global-context";
import { Alert } from "react-native";

type MabcCircuitType = "mabc_1" | "mabc_2" | "mabc_3";

const MABC_AGE_RANGES: Record<
  MabcCircuitType,
  { min: number; max: number; label: string }
> = {
  mabc_1: {
    min: 3,
    max: 6,
    label: "3 a 6 anos",
  },
  mabc_2: {
    min: 7,
    max: 10,
    label: "7 a 10 anos",
  },
  mabc_3: {
    min: 11,
    max: 16,
    label: "11 a 16 anos",
  },
};

function isMabcCircuitType(type: CircuitType): type is MabcCircuitType {
  return type === "mabc_1" || type === "mabc_2" || type === "mabc_3";
}

function isCircuitAvailableForStudentAge(
  circuit: Circuit,
  studentAge: number | null
) {
  if (!isMabcCircuitType(circuit.type)) {
    return true;
  }

  if (studentAge === null) {
    return false;
  }

  const range = MABC_AGE_RANGES[circuit.type];

  return studentAge >= range.min && studentAge <= range.max;
}

function getCircuitDescription(circuit: Circuit) {
  if (isMabcCircuitType(circuit.type)) {
    const range = MABC_AGE_RANGES[circuit.type];

    return circuit.exercisesCount > 0
      ? `${circuit.exercisesCount} exercícios - Faixa etária ${range.label} - ${circuit.exercisesSummary}`
      : `Faixa etária ${range.label} - Sem exercícios vinculados`;
  }

  return circuit.exercisesCount > 0
    ? `${circuit.exercisesCount} exercícios - ${circuit.exercisesSummary}`
    : "Sem exercícios vinculados";
}

export default function CircuitSelectionRoute() {
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const { circuits } = useCircuits();
  const { activeSessions } = useSessionGlobalContext();

  const [studentAge, setStudentAge] = useState<number | null>(null);

  const studentActiveSession = useMemo(() => {
    if (!studentId) return undefined;
    return Object.values(activeSessions).find((s) => s.studentId === studentId);
  }, [activeSessions, studentId]);

  useEffect(() => {
    async function loadStudentAge() {
      if (!studentId) {
        setStudentAge(null);
        return;
      }

      const { data, error } = await supabase
        .from("alunos")
        .select("data_nascimento")
        .eq("id", studentId)
        .single();

      if (error) {
        console.error("Erro ao buscar data de nascimento do aluno:", error);
        setStudentAge(null);
        return;
      }

      const age = calculateAge(data?.data_nascimento ?? null);
      setStudentAge(age);
    }

    loadStudentAge();
  }, [studentId]);

  // Tipo real do circuito no banco (padrao/mabc_1/mabc_2/mabc_3) por id,
  // usado para o fluxo de execução distinguir MABC dos demais.
  const dbTipoById = useMemo(
    () => new Map(circuits.map((circuit) => [circuit.id, circuit.type])),
    [circuits]
  );

  // Circuitos reais da equipe filtrados pela idade do aluno + entradas de formulário (ATA/CARS).
  const items: CircuitItem[] = useMemo(() => {
    const availableCircuits = circuits.filter((circuit) =>
      isCircuitAvailableForStudentAge(circuit, studentAge)
    );

    const real: CircuitItem[] = availableCircuits.map((circuit) => ({
      id: circuit.id,
      name: circuit.name,
      description: getCircuitDescription(circuit),
      type:
        circuit.executionMode === "semi-estruturado"
          ? "semi-estruturado"
          : "estruturado",
      exercises: circuit.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
      })),
    }));

    // Registros padronizados — sempre disponíveis para iniciar uma nova avaliação.
    const formularios: CircuitItem[] = [
      {
        id: "formulario-ata",
        name: "ATA",
        description: "Iniciar um novo registro ATA",
        type: "ata",
      },
      {
        id: "formulario-cars",
        name: "CARS",
        description: "Iniciar um novo registro CARS",
        type: "cars",
      },
    ];

    return [...real, ...formularios];
  }, [circuits, studentAge]);

  return (
    <CircuitSelectionScreen
      studentName={studentName || "Aluno"}
      circuits={items}
      onPressBack={() => router.back()}
      onPressCircuit={(circuit: CircuitItem) => {
        // Block starting a different circuit if one is already active
        if (studentActiveSession && studentActiveSession.activeExerciseId != null && studentActiveSession.circuitId !== circuit.id) {
          Alert.alert(
            "Circuito em andamento",
            "O aluno já possui um circuito em andamento. Conclua ou cancele o circuito atual antes de iniciar um novo."
          );
          return;
        }

        const exercisesParam = JSON.stringify(circuit.exercises ?? []);

        // If it's the exact same circuit, pass the sessionId to resume instead of creating a new one
        const resumeSessionId = studentActiveSession?.circuitId === circuit.id ? studentActiveSession.sessionId : undefined;

        const baseParams = {
          studentName,
          studentId: studentId ?? "",
          circuitId: circuit.id,
          circuitName: circuit.name,
          circuitType: dbTipoById.get(circuit.id) ?? "padrao",
          exercises: exercisesParam,
          ...(resumeSessionId ? { sessionId: resumeSessionId } : {}),
        };

        if (circuit.type === "semi-estruturado") {
          router.push({
            pathname: "/session/semi-structured",
            params: baseParams,
          });
        } else if (circuit.type === "estruturado") {
          router.push({
            pathname: "/session/structured",
            params: baseParams,
          });
        } else if (circuit.type === "ata" || circuit.type === "cars") {
          router.push({
            pathname: "/form",
            params: {
              studentName,
              studentId: studentId ?? "",
              circuitType: circuit.type,
              circuitName: circuit.name,
            },
          });
        }
      }}
    />
  );
}
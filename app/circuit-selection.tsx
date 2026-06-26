import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { calculateAge } from "@/lib/date-utils";
import { getStartGuard, type StartGuardState } from "@/lib/session-start-guard";
import { supabase } from "@/lib/supabase";
import { ConcurrentSessionModal } from "@/components/concurrent-session-modal";
import {
  Circuit,
  CircuitType,
  useCircuits,
} from "../features/exercises/hooks/use-circuits";
import { useSessionFlow } from "../features/sessions/hooks/use-session-flow";
import {
  CircuitItem,
  CircuitSelectionScreen,
} from "../features/sessions/screens/circuit-selection-screen";

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

/** Type guard for the three age-banded MABC circuit types. */
function isMabcCircuitType(type: CircuitType): type is MabcCircuitType {
  return type === "mabc_1" || type === "mabc_2" || type === "mabc_3";
}

/**
 * Returns whether a circuit can be run for a student of the given age. Non-MABC
 * circuits are always available; MABC circuits require the age to fall within
 * their band.
 */
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

/** Builds the subtitle describing a circuit's exercises and, for MABC, its age band. */
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

type GuardModalType =
  | "session-conflict"
  | "rc-pending"
  | "form-conflict"
  | null;

/**
 * Route for choosing what to start for a student: a circuit session (structured
 * or semi-structured) or a form (ATA/CARS/MABC-2), filtered by the student's
 * age. Detects in-progress sessions and pending records via the start guard and
 * prompts the user to resume or finish/replace before starting something new.
 */
export default function CircuitSelectionRoute() {
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const { circuits, isLoading: circuitsLoading } = useCircuits();
  const { finishSessionAndSaveUnexecuted } = useSessionFlow();

  const [studentAge, setStudentAge] = useState<number | null>(null);
  const [ageResolved, setAgeResolved] = useState(false);
  const [guardModal, setGuardModal] = useState<GuardModalType>(null);
  const [guardData, setGuardData] = useState<StartGuardState | null>(null);
  const pendingCircuitRef = useRef<CircuitItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadStudentAge() {
      if (!studentId) {
        setStudentAge(null);
        setAgeResolved(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("alunos")
          .select("data_nascimento")
          .eq("id", studentId)
          .single();

        if (error) {
          setStudentAge(null);
          return;
        }

        const age = calculateAge(data?.data_nascimento ?? null);
        setStudentAge(age);
      } finally {
        setAgeResolved(true);
      }
    }

    loadStudentAge();
  }, [studentId]);

  const dbTipoById = useMemo(
    () => new Map(circuits.map((circuit) => [circuit.id, circuit.type])),
    [circuits]
  );

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
        iconUrl: exercise.iconUrl ?? null,
      })),
    }));

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

    const mabcForms: CircuitItem[] = [];
    if (studentAge !== null && studentAge >= 3 && studentAge <= 16) {
      let faixaLabel = "";
      if (studentAge <= 6) faixaLabel = "3 a 6 anos";
      else if (studentAge <= 10) faixaLabel = "7 a 10 anos";
      else faixaLabel = "11 a 16 anos";

      mabcForms.push({
        id: "formulario-mabc2",
        name: "MABC-2",
        description: `Iniciar uma nova avaliação MABC-2 — Faixa ${faixaLabel}`,
        type: "mabc",
      });
    }

    return [...real, ...formularios, ...mabcForms];
  }, [circuits, studentAge]);

  const isFormType = (type: string) =>
    type === "ata" || type === "cars" || type === "mabc";

  const navigateToSession = useCallback(
    (circuit: CircuitItem) => {
      const exercisesParam = JSON.stringify(circuit.exercises ?? []);
      const baseParams = {
        studentName,
        studentId: studentId ?? "",
        circuitId: circuit.id,
        circuitName: circuit.name,
        circuitType: dbTipoById.get(circuit.id) ?? "padrao",
        exercises: exercisesParam,
      };

      if (circuit.type === "semi-estruturado") {
        router.push({ pathname: "/session/semi-structured", params: baseParams });
      } else {
        router.push({ pathname: "/session/structured", params: baseParams });
      }
    },
    [studentName, studentId, dbTipoById]
  );

  const navigateToForm = useCallback(
    (circuit: CircuitItem) => {
      const formTipo = circuit.type === "mabc" ? "mabc2" : circuit.type;
      router.push({
        pathname: "/form",
        params: {
          studentName,
          studentId: studentId ?? "",
          circuitType: formTipo,
          circuitName: circuit.name,
        },
      });
    },
    [studentName, studentId]
  );

  const navigateToExistingForm = useCallback(
    (formularioId: string, tipo: string) => {
      const nameMap: Record<string, string> = {
        ata: "ATA",
        cars: "CARS",
        mabc2: "MABC-2",
        registro_controle: "Registro de Controle",
      };
      router.push({
        pathname: "/form",
        params: {
          formularioId,
          studentName,
          studentId: studentId ?? "",
          circuitType: tipo,
          circuitName: nameMap[tipo] ?? tipo,
        },
      });
    },
    [studentName, studentId]
  );

  const resumeInProgressSession = useCallback(
    (guard: StartGuardState) => {
      const session = guard.inProgressSession!;
      const circuitoId = session.circuitoId;

      const circuit = circuitoId
        ? circuits.find((c) => c.id === circuitoId)
        : null;

      const exercisesParam = JSON.stringify(
        (circuit?.exercises ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          iconUrl: e.iconUrl ?? null,
        }))
      );

      const pathname =
        session.modoExecucao === "semi-estruturado"
          ? "/session/semi-structured"
          : "/session/structured";

      router.push({
        pathname,
        params: {
          sessionId: session.id,
          studentId: studentId ?? "",
          studentName: studentName ?? "Aluno",
          circuitId: circuitoId ?? "",
          circuitType: circuit
            ? (dbTipoById.get(circuit.id) ?? "padrao")
            : "padrao",
          circuitName: circuit?.name ?? "Sessão",
          exercises: exercisesParam,
        },
      });
    },
    [circuits, studentId, studentName, dbTipoById]
  );

  const handlePressCircuit = useCallback(
    async (circuit: CircuitItem) => {
      if (!studentId) return;

      const guard = await getStartGuard(studentId);
      const isForm = isFormType(circuit.type);

      if (!isForm) {
        if (guard.inProgressSession) {
          pendingCircuitRef.current = circuit;
          setGuardData(guard);
          setGuardModal("session-conflict");
          return;
        }
        if (guard.pendingByType.registro_controle) {
          pendingCircuitRef.current = circuit;
          setGuardData(guard);
          setGuardModal("rc-pending");
          return;
        }
      } else {
        const guardKey = circuit.type === "mabc" ? "mabc2" : circuit.type;
        if (guard.pendingByType[guardKey]) {
          pendingCircuitRef.current = circuit;
          setGuardData(guard);
          setGuardModal("form-conflict");
          return;
        }
      }

      if (isForm) {
        navigateToForm(circuit);
      } else {
        navigateToSession(circuit);
      }
    },
    [studentId, navigateToSession, navigateToForm]
  );

  const handleContinueCurrent = useCallback(async () => {
    if (!guardData) return;

    setGuardModal(null);

    if (guardModal === "session-conflict") {
      resumeInProgressSession(guardData);
    } else if (guardModal === "rc-pending") {
      const rcId = guardData.pendingByType.registro_controle;
      navigateToExistingForm(rcId, "registro_controle");
    } else if (guardModal === "form-conflict") {
      const tipo = pendingCircuitRef.current?.type ?? "";
      const guardKey = tipo === "mabc" ? "mabc2" : tipo;
      const formId = guardData.pendingByType[guardKey];
      if (formId) navigateToExistingForm(formId, guardKey);
    }
  }, [guardData, guardModal, resumeInProgressSession, navigateToExistingForm]);

  const handleFinishAndStartNew = useCallback(async () => {
    if (!guardData) return;
    setIsProcessing(true);

    try {
      if (guardModal === "session-conflict" && guardData.inProgressSession) {
        await finishSessionAndSaveUnexecuted(guardData.inProgressSession.id);
      } else if (guardModal === "form-conflict") {
        const tipo = pendingCircuitRef.current?.type ?? "";
        const guardKey = tipo === "mabc" ? "mabc2" : tipo;
        const oldFormId = guardData.pendingByType[guardKey];
        if (oldFormId) {
          await supabase
            .from("formularios")
            .update({ ativo: false })
            .eq("id", oldFormId);
        }
      }

      setGuardModal(null);

      const circuit = pendingCircuitRef.current;
      if (circuit) {
        if (isFormType(circuit.type)) {
          navigateToForm(circuit);
        } else {
          navigateToSession(circuit);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    guardData,
    guardModal,
    finishSessionAndSaveUnexecuted,
    navigateToSession,
    navigateToForm,
  ]);

  const modalProps = useMemo(() => {
    if (guardModal === "session-conflict") {
      return {
        title: "Sessão em andamento",
        message:
          "Já existe uma sessão em andamento com este aluno. O que deseja fazer?",
        continueLabel: "Continuar sessão em andamento",
        finishLabel: isProcessing
          ? "Finalizando..."
          : "Finalizar sessão e iniciar nova",
      };
    }
    if (guardModal === "rc-pending") {
      return {
        title: "Registro de Controle pendente",
        message:
          "Existe um Registro de Controle de uma sessão anterior que ainda não foi preenchido.",
        continueLabel: "Preencher registro de controle",
        finishLabel: "Iniciar nova sessão",
      };
    }
    if (guardModal === "form-conflict") {
      const tipo = pendingCircuitRef.current?.type ?? "";
      const nameMap: Record<string, string> = {
        ata: "ATA",
        cars: "CARS",
        mabc: "MABC-2",
      };
      const formName = nameMap[tipo] ?? tipo;
      return {
        title: `Formulário ${formName} pendente`,
        message: `Já existe um formulário ${formName} pendente para este aluno. O que deseja fazer?`,
        continueLabel: "Continuar formulário anterior",
        finishLabel: isProcessing
          ? "Apagando..."
          : "Apagar anterior e iniciar um novo",
      };
    }
    return {};
  }, [guardModal, isProcessing]);

  return (
    <>
      <CircuitSelectionScreen
        studentName={studentName || "Aluno"}
        circuits={items}
        isLoading={circuitsLoading || !ageResolved}
        onPressBack={() => router.back()}
        onPressCircuit={handlePressCircuit}
      />

      <ConcurrentSessionModal
        visible={guardModal !== null}
        onRequestClose={() => setGuardModal(null)}
        onContinueCurrent={handleContinueCurrent}
        onFinishAndStartNew={handleFinishAndStartNew}
        {...modalProps}
      />
    </>
  );
}

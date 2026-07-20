import { CircuitsScreen } from "@/features/circuits/screens/circuits-screen";
import { ExercisesScreen } from "@/features/exercises/screens/exercises-screen";
import { StudentsScreen } from "@/features/students/screens/students-screen";
import {
  ALUNOS_SIMULATION,
  CIRCUITOS_SIMULATION,
  EXERCICIOS_SIMULATION,
} from "@/features/tutorial/constants/simulations";
import {
  SimulationSubStep,
  TutorialSimulationProvider,
} from "@/features/tutorial/contexts/tutorial-simulation-context";
import { TutorialTapGuard } from "@/features/tutorial/components/tutorial-tap-guard";
import { useTutorial } from "@/features/tutorial/contexts/tutorial-context";
import { TutorialPracticeScreen } from "@/features/tutorial/screens/tutorial-practice-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ReactNode, useCallback } from "react";

/**
 * Route for a tutorial step's practice. Feature-specific modules render a 1:1
 * replica of the real screen inside a {@link TutorialSimulationProvider}, which
 * drives the guided sub-steps and, on completion, advances the module to its
 * wrap-up step. Modules without a dedicated replica fall back to the generic
 * practice sandbox.
 */
export default function TutorialPracticeRoute() {
  const router = useRouter();
  const { moduleId, stepIndex } = useLocalSearchParams<{
    moduleId: string;
    stepIndex: string;
  }>();
  const { requestStep } = useTutorial();

  const handleComplete = useCallback(() => {
    requestStep(moduleId, (Number(stepIndex) || 0) + 1);
    router.back();
  }, [requestStep, router, moduleId, stepIndex]);

  const replicas: Record<
    string,
    { subSteps: SimulationSubStep[]; screen: ReactNode }
  > = {
    alunos: { subSteps: ALUNOS_SIMULATION, screen: <StudentsScreen tutorial /> },
    exercicios: {
      subSteps: EXERCICIOS_SIMULATION,
      screen: <ExercisesScreen tutorial />,
    },
    circuitos: {
      subSteps: CIRCUITOS_SIMULATION,
      screen: <CircuitsScreen tutorial />,
    },
  };

  const replica = replicas[moduleId];
  if (replica) {
    return (
      <TutorialSimulationProvider
        subSteps={replica.subSteps}
        onComplete={handleComplete}
      >
        <TutorialTapGuard>{replica.screen}</TutorialTapGuard>
      </TutorialSimulationProvider>
    );
  }

  return <TutorialPracticeScreen />;
}

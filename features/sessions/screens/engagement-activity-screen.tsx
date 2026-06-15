import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { StartActivity } from "@/features/exercises/components/start-activity";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import { ActivityResultModal } from "@/features/exercises/components/activity-result-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";

export function EngagementActivityScreen() {
  const router = useRouter();
  const { studentName } = useLocalSearchParams<{ studentName: string }>();
  const safeStudentName = studentName || "Lucas";

  const [stage, setStage] = useState<"ready" | "running">("ready");
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  const triggerToastAndBack = () => {
    setShowSuccessToast(true);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.timing(toastTranslateY, { toValue: 20, duration: 350, useNativeDriver: true }),
        ]).start(() => {
          setShowSuccessToast(false);
          router.back();
        });
      }, 2000);
    });
  };

  const handleStop = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleResult = () => {
    setIsResultModalOpen(false);
    triggerToastAndBack();
  };

  const handleConfirmFinish = () => {
    setIsFinishModalOpen(false);
    triggerToastAndBack();
  };

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant={stage === "running" ? "finishEngagement" : "back"}
        onPressBack={() => router.back()}
        onPressFinish={() => setIsFinishModalOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="left-6 top-[2%] w-[264px]">
          <PageHeader 
            title={`Sessão de ${safeStudentName}`} 
            subtitle="Circuito Semi-estruturado · Engajamento" 
          />
        </View>

        <View className="top-[4%] p-5 rounded-2xl w-[100%] justify-center align-center">
          {stage === "ready" ? (
            <StartActivity
              title="Atividade de engajamento"
              subtitle="Momento focado na interação com o aluno"
              onStart={() => setStage("running")}
              onStartAndRecord={() => setStage("running")}
            />
          ) : (
            <Stopwatch
              title="Atividade de engajamento"
              subtitle="Momento focado na interação com o aluno"
              autoStart
              variant="minimize"
              className="bg-level2"
              onStop={handleStop}
              onToggleRunning={() => {}}
              onPressCrise={() => {}}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isFinishModalOpen}
        mode="finishEngagement"
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={handleConfirmFinish}
      />

      <ActivityResultModal
        visible={isResultModalOpen}
        exerciseTitle="Atividade de engajamento"
        elapsedTime={elapsedTimeStr}
        onClose={() => setIsResultModalOpen(false)}
        onDefer={handleResult}
        onNotCompleted={handleResult}
        onConfirm={handleResult}
      />

          {showSuccessToast && (
            <Animated.View
              style={{
                position: "absolute",
                bottom: 100,
                left: 20,
                right: 20,
                backgroundColor: "rgba(52, 199, 89, 0.25)",
                borderColor: "#34C759",
                borderWidth: 1,
                borderRadius: 15,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                opacity: toastOpacity,
                transform: [{ translateY: toastTranslateY }],
                zIndex: 999
              }}
            >
              <CheckCircle2 size={20} color="#34C759" strokeWidth={3} />
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: "#fff", flex: 1 }}>
                Registro atualizado
              </Text>
            </Animated.View>
          )}
    </View>
  );
}

export default EngagementActivityScreen;
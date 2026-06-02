import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionRunningFreeScreen } from "../../features/sessions/screens/session-running-free-screen";

export default function SessionLivreRoute() {
  // Esta tela gerencia a listagem livre dos exercícios e o botão amarelo de engajamento
  return <SessionRunningFreeScreen />;
}
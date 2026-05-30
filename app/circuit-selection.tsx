import React from "react";
import { useLocalSearchParams, router } from "expo-router";

import { CircuitSelectionScreen } from "../features/sessions/screens/circuit-selection-screen";

export default function CircuitSelectionRoute() {
  const { studentName } = useLocalSearchParams<{ studentName: string }>();

  return (
    <CircuitSelectionScreen 
      // Passa o nome pra tela (ou "Aluno" como fallback de segurança)
      studentName={studentName || "Aluno"} 
      
      onPressBack={() => router.back()} 
      
      onPressCircuit={(circuit) => {
        console.log("Clicou no circuito:", circuit.name);
      }}
    />
  );
}
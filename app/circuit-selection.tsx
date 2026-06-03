import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import { CircuitSelectionScreen, CircuitItem } from "../features/sessions/screens/circuit-selection-screen";

export default function CircuitSelectionRoute() {
  const { studentName } = useLocalSearchParams<{ studentName: string }>();

  return (
    <CircuitSelectionScreen 
      studentName={studentName || "Aluno"} 
      onPressBack={() => router.back()} 
      
      onPressCircuit={(circuit: CircuitItem) => {
        if (circuit.type === "livre") {
          router.push({
            pathname: "/session/free",
            params: { studentName, circuitName: circuit.name }
          });
        } else if (circuit.type === "estruturado") {
          router.push({
            pathname: "/session/structured",
            params: { studentName, circuitName: circuit.name }
          });
        } else if (circuit.type === "ata") {
          router.push({
            pathname: "/form/ata",
            params: { studentName, circuitName: circuit.name }
          });
        } else if (circuit.type === "cars") {
          router.push({
            pathname: "/form/cars",
            params: { studentName, circuitName: circuit.name }
          });
        }       
      }}
    />
  );
}
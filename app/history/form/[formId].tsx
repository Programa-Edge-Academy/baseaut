import React from "react";
import { useLocalSearchParams } from "expo-router";

import { FormAnswersScreen } from "../../../features/forms/screens/form-answers-screen";

export default function FormAnswersRoute() {
  const { formId, studentName } = useLocalSearchParams<{
    formId: string;
    studentName?: string;
  }>();

  return (
    <FormAnswersScreen
      formId={formId as string}
      studentName={studentName || "Aluno"}
    />
  );
}

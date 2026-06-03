import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import {
  useFormAnswers,
  type FormQuestion,
} from "../hooks/use-form-answers";

/** Renders the proper editable control for each question type. */
function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const isNumeric =
    question.tipo === "numerico" ||
    question.tipo === "escala_decimal" ||
    question.tipo === "escala_inteira" ||
    question.tipo === "escala_likert";

  if (question.tipo === "booleano") {
    const options = ["Sim", "Não"];
    return (
      <View className="mt-2 flex-row gap-3">
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className="flex-1 items-center rounded-[10px] border py-3"
              style={{
                borderColor: selected ? colors.primary : colors.outline,
                backgroundColor: selected ? `${colors.primary}26` : colors.level1,
              }}
            >
              <Text
                className="text-default-2 font-medium"
                style={{ color: selected ? colors.primary : colors.muted }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (
    (question.tipo === "selecao_unica" || question.tipo === "multipla_escolha") &&
    question.opcoes.length > 0
  ) {
    return (
      <View className="mt-2 gap-2">
        {question.opcoes.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className="rounded-[10px] border px-4 py-3"
              style={{
                borderColor: selected ? colors.primary : colors.outline,
                backgroundColor: selected ? `${colors.primary}26` : colors.level1,
              }}
            >
              <Text
                className="text-default-2"
                style={{ color: selected ? colors.primary : colors.muted }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <DefaultTextInput
      className="mt-2"
      multiline={question.tipo === "texto_longo"}
      keyboardType={isNumeric ? "numeric" : "default"}
      placeholder="Responda aqui"
      value={value}
      onChangeText={onChange}
    />
  );
}

export type FormAnswersScreenProps = {
  formId: string;
  studentName?: string;
};

export function FormAnswersScreen({
  formId,
  studentName,
}: FormAnswersScreenProps) {
  const router = useRouter();
  const {
    form,
    questions,
    answers,
    isLoading,
    isSaving,
    error,
    setAnswer,
    saveAnswers,
  } = useFormAnswers(formId);

  const handleSave = async () => {
    try {
      await saveAnswers();
      Alert.alert("Respostas salvas", "As respostas foram atualizadas.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (caught: any) {
      Alert.alert(
        "Erro ao salvar",
        caught?.message ?? "Não foi possível salvar as respostas.",
      );
    }
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" />

      <View className="mx-8 mt-5">
        <PageHeader
          title="Editar respostas do formulário"
          subtitle={form?.titulo ?? studentName ?? "Formulário"}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="mt-16 items-center px-8">
          <Text className="text-center text-default-2 text-extra">
            {error.message || "Erro ao carregar o formulário."}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="mt-5 px-8"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {questions.length === 0 ? (
            <Text className="text-center text-muted text-default-2 mt-10">
              Este formulário não possui perguntas.
            </Text>
          ) : (
            questions.map((question) => (
              <View
                key={question.id}
                className="mb-4 rounded-2xl border border-outline bg-level2 p-4"
              >
                <Text className="text-white text-default-2 font-medium">
                  {question.texto}
                  {question.obrigatoria ? " *" : ""}
                </Text>
                <QuestionInput
                  question={question}
                  value={answers[question.id] ?? ""}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              </View>
            ))
          )}

          {questions.length > 0 && (
            <DefaultButton
              label={isSaving ? "Salvando..." : "Salvar respostas"}
              onPress={handleSave}
              disabled={isSaving}
              sizeClass="w-full h-12"
              className="mt-2"
            />
          )}
        </ScrollView>
      )}

      <Footer />
    </View>
  );
}

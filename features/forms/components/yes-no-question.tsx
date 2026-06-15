import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { YesNoQuestion } from "../types";

/**
 * Props for a yes/no question UI.
 */
interface Props {
  question: YesNoQuestion;
  value?: any;
  onChange?: (val: any) => void;
  renderSubQuestion?: (
    question: NonNullable<YesNoQuestion["subQuestion"]>,
  ) => ReactNode;
}

/**
 * Renders a yes/no question with optional conditional sub-question.
 */
export function YesNoQuestionUI({
  question,
  value,
  onChange,
  renderSubQuestion,
}: Props) {
  const selected = value as "sim" | "nao" | null;

  /**
   * Toggles the selected answer option.
   */
  const handleSelect = (option: "sim" | "nao") => {
    const newVal = selected === option ? null : option;
    if (onChange) onChange(newVal);
  };

  const showSubQuestion =
    (question.subtype === "conditional_positive" && selected === "sim") ||
    (question.subtype === "conditional_negative" && selected === "nao");

  return (
    <View className="self-stretch flex flex-col mt-2">
      <View className="flex flex-row gap-4">
        <Pressable
          onPress={() => handleSelect("nao")}
          className={`flex-1 h-[44px] items-center justify-center rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline active:opacity-80 ${
            selected === "nao" ? "bg-error shadow-errorShadow" : "bg-level1 shadow-none"
          }`}
        >
          <Text className="text-header-3 text-white">Não</Text>
        </Pressable>

        <Pressable
          onPress={() => handleSelect("sim")}
          className={`flex-1 h-[44px] items-center justify-center rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline active:opacity-80 ${
            selected === "sim" ? "bg-primary shadow-primaryShadow" : "bg-level1 shadow-none"
          }`}
        >
          <Text className="text-header-3 text-white">Sim</Text>
        </Pressable>
      </View>

      {showSubQuestion &&
        question.subQuestion &&
        renderSubQuestion?.(question.subQuestion)}
    </View>
  );
}

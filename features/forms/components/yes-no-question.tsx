import type { ReactNode } from "react";
import { View } from "react-native";
import { DefaultButton } from "../../../components/default-button";
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
        <DefaultButton
          label="Não"
          onPress={() => handleSelect("nao")}
          bgColorClass={selected === "nao" ? "bg-error" : "bg-level1"}
          shadowClass={selected === "nao" ? "shadow-errorShadow" : ""}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline"
          textClassName="text-header-3 text-white"
        />

        <DefaultButton
          label="Sim"
          onPress={() => handleSelect("sim")}
          bgColorClass={selected === "sim" ? "bg-primary" : "bg-level1"}
          shadowClass={selected === "sim" ? "shadow-primaryShadow" : ""}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline"
          textClassName="text-header-3 text-white"
        />
      </View>

      {showSubQuestion &&
        question.subQuestion &&
        renderSubQuestion?.(question.subQuestion)}
    </View>
  );
}

import type { ReactNode } from "react";
import { View } from "react-native";
import { YesNoQuestion } from "../types";
import { DefaultButton } from "@/components/default-button";

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
 * Renders a yes/no question with an optional conditional sub-question.
 *
 * @remarks
 * Each button's `key` changes together with the selection state. This forces
 * react-native-css-interop (NativeWind) to remount the button on every
 * `className` change instead of updating it in place, which avoids the
 * css-interop upgrade path whose serializer reaches into the react-navigation
 * context and throws "Couldn't find a navigation context".
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
      <View className="flex-row gap-4">
        <DefaultButton
          key={`nao-${selected === "nao"}`}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px]"
          label="Não"
          onPress={() => handleSelect("nao")}
          isOutline={true}
          outlineBorderClass={selected === "nao" ? "border-error" : "border-outline"}
          textClassName="text-white"
          hasShadow={selected === "nao"}
          bgColorClass={selected === "nao" ? "bg-error" : "bg-level1"}
          shadowClass={selected === "nao" ? "shadow-errorShadow" : ""}
        />
        <DefaultButton
          key={`sim-${selected === "sim"}`}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px]"
          label="Sim"
          onPress={() => handleSelect("sim")}
          isOutline={true}
          outlineBorderClass={selected === "sim" ? "border-primary" : "border-outline"}
          textClassName="text-white"
          hasShadow={selected === "sim"}
          bgColorClass={selected === "sim" ? "bg-primary" : "bg-level1"}
          shadowClass={selected === "sim" ? "shadow-errorShadow" : ""}
        />
      </View>

      {showSubQuestion &&
        question.subQuestion &&
        renderSubQuestion?.(question.subQuestion)}
    </View>
  );
}

import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { ChoiceListQuestion } from "../types";

/**
 * Props for a choice list question UI.
 */
interface Props {
  question: ChoiceListQuestion;
  value?: any;
  onChange?: (val: any) => void;
}

/**
 * Renders a choice list with optional "other" input.
 */
export function ChoiceListQuestionUI({ question, value, onChange }: Props) {
  const selectedOptions = value?.selected || [];
  const otherText = value?.other || "";

  /**
   * Toggles a choice option and updates selection state.
   */
  const toggleOption = (option: string) => {
    let newOptions;
    if (selectedOptions.includes(option)) {
      newOptions = selectedOptions.filter((o: string) => o !== option);
    } else {
      newOptions = question.multiple ? [...selectedOptions, option] : [option];
    }
    if (onChange) onChange({ selected: newOptions, other: otherText });
  };

  const options = question.allowOther
    ? [...question.options, "Outro"]
    : question.options;

  return (
    <View className="self-stretch flex flex-col gap-2.5 mt-2">
      {options.map((opt) => {
        const isSelected = selectedOptions.includes(opt);
        return (
          <View key={opt} className="flex flex-col gap-2">
            <Pressable
              onPress={() => toggleOption(opt)}
              className="flex flex-row items-center gap-3"
            >
              <View
                className={`w-8 h-8 rounded-full outline outline-1 outline-offset-[-1px] justify-center items-center ${isSelected ? "bg-primary outline-transparent" : "bg-level1 outline-outline"}`}
              >
                {isSelected && <Check color="#fff" size={18} />}
              </View>
              <View className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-level1 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline justify-center">
                <Text className="text-white text-default-2">{opt}</Text>
              </View>
            </Pressable>

            {opt === "Outro" && isSelected && (
              <DefaultTextInput
                value={otherText}
                onChangeText={(text) => {
                  if (onChange) onChange({ selected: selectedOptions, other: text });
                }}
                placeholder="Especifique..."
                className="ml-11 min-h-[44px]"
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

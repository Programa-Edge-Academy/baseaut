import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
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

/** Option that is mutually exclusive with every other choice. */
const NONE_OPTION = "Nenhuma das opções";

/**
 * Renders a choice list with optional "other" input.
 */
export function ChoiceListQuestionUI({ question, value, onChange }: Props) {
  const colors = useThemeColors();
  const selectedOptions = value?.selected || [];
  const otherText = value?.other || "";

  /**
   * Toggles a choice option and updates selection state.
   *
   * @remarks
   * "Nenhuma das opções" is mutually exclusive: selecting it clears every other
   * choice, and selecting any other choice clears it.
   */
  const toggleOption = (option: string) => {
    let newOptions: string[];
    if (selectedOptions.includes(option)) {
      newOptions = selectedOptions.filter((o: string) => o !== option);
    } else if (option === NONE_OPTION) {
      newOptions = [NONE_OPTION];
    } else if (question.multiple) {
      newOptions = [
        ...selectedOptions.filter((o: string) => o !== NONE_OPTION),
        option,
      ];
    } else {
      newOptions = [option];
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
                className="w-8 h-8 rounded-xl border border-outline justify-center items-center"
                style={{ backgroundColor: isSelected ? colors.primary : colors.level1 }}
              >
                {isSelected && <Check color="#fff" size={18} />}
              </View>
              <View className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-level1 rounded-xl border border-outline justify-center">
                <Text className="text-content text-default-2">{opt}</Text>
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

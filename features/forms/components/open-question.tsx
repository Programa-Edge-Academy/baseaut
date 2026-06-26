import { View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { OpenQuestion } from "../types";

/** Props for {@link OpenQuestionUI}. */
interface Props {
  question: OpenQuestion;
  value?: any;
  onChange?: (val: any) => void;
}

/**
 * Renders an open-ended text question. Numeric questions (e.g. MABC) accept only
 * integer digits on a single line with a numeric keyboard.
 */
export function OpenQuestionUI({ question, value, onChange }: Props) {
  const isNumeric = (question as any).numeric === true;

  const handleNumericChange = (text: string) => {
    onChange?.(text.replace(/[^0-9]/g, ""));
  };

  return (
    <View className="self-stretch flex flex-row items-end gap-3 mt-2">
      <DefaultTextInput
        multiline={!isNumeric}
        keyboardType={isNumeric ? "number-pad" : "default"}
        className="flex-1 min-h-[44px]"
        placeholder={isNumeric ? "Apenas números" : "Responda aqui"}
        value={value || ""}
        onChangeText={isNumeric ? handleNumericChange : onChange}
      />
    </View>
  );
}

import { View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { OpenQuestion } from "../types";

interface Props {
  question: OpenQuestion;
  value?: any;
  onChange?: (val: any) => void;
}

/**
 * Renders an open-ended question with optional audio action placeholder.
 */
export function OpenQuestionUI({ question, value, onChange }: Props) {
  const isNumeric = (question as any).numeric === true;

  // Perguntas numéricas (ex.: MABC) aceitam apenas dígitos inteiros — sem
  // separador decimal (nem "," nem "."), em linha única e teclado numérico.
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

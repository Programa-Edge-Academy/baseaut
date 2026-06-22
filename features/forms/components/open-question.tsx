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

  // Perguntas numéricas (ex.: MABC) aceitam apenas dígitos e um separador
  // decimal, em linha única e com teclado numérico.
  const handleNumericChange = (text: string) => {
    let sanitized = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const firstDot = sanitized.indexOf(".");
    if (firstDot !== -1) {
      sanitized =
        sanitized.slice(0, firstDot + 1) +
        sanitized.slice(firstDot + 1).replace(/\./g, "");
    }
    onChange?.(sanitized);
  };

  return (
    <View className="self-stretch flex flex-row items-end gap-3 mt-2">
      <DefaultTextInput
        multiline={!isNumeric}
        keyboardType={isNumeric ? "decimal-pad" : "default"}
        className="flex-1 min-h-[44px]"
        placeholder={isNumeric ? "Apenas números" : "Responda aqui"}
        value={value || ""}
        onChangeText={isNumeric ? handleNumericChange : onChange}
      />
    </View>
  );
}

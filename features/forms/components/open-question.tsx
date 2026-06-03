import { colors } from "@/assets/colors";
import { Mic } from "lucide-react-native";
import { Pressable, View } from "react-native";
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
  /**
   * Placeholder handler for starting audio recording.
   */

  return (
    <View className="self-stretch flex flex-row items-end gap-3 mt-2">
      <DefaultTextInput
        multiline
        className="flex-1 min-h-[44px]"
        placeholder="Responda aqui"
        value={value || ""}
        onChangeText={onChange}
      />
    </View>
  );
}

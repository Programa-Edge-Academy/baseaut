import { colors } from "@/assets/colors";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Text, View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { LinearScaleQuestion } from "../types";

/**
 * Props for a linear scale question UI.
 */
interface Props {
  question: LinearScaleQuestion;
}

/**
 * Renders a linear scale slider with numeric input.
 */
export function LinearScaleQuestionUI({ question }: Props) {
  const [selectedValue, setSelectedValue] = useState<number>(question.min);
  const [textValue, setTextValue] = useState<string>(String(question.min));

  /**
   * Updates the numeric input while preserving valid characters.
   */
  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9-]/g, "");
    setTextValue(numericText);
  };

  /**
   * Normalizes the input value and clamps it to bounds.
   */
  const handleBlur = () => {
    let val = Math.round(Number(textValue));

    if (isNaN(val) || val < question.min) val = question.min;
    if (val > question.max) val = question.max;

    setTextValue(String(val));
    setSelectedValue(val);
  };

  /**
   * Syncs slider changes to the numeric input.
   */
  const handleSliderChange = (val: number) => {
    setSelectedValue(val);
    setTextValue(String(val));
  };

  return (
    <View className="self-stretch flex flex-col items-center mt-2">
      <View className="flex flex-row justify-between items-center self-stretch px-2 mb-2">
        <Text className="text-muted text-default-2">{question.min}</Text>

        <DefaultTextInput
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          className="text-primary text-header-2 text-center w-20 py-2"
        />

        <Text className="text-muted text-default-2">{question.max}</Text>
      </View>

      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={question.min}
        maximumValue={question.max}
        step={question.step}
        value={selectedValue}
        onValueChange={handleSliderChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.placeholder}
        thumbTintColor={colors.primary}
      />
    </View>
  );
}

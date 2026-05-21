import { colors } from "@/assets/colors";
import { HelpCircle, Mic, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { FormQuestionProps } from "../types";
import { ChoiceListQuestionUI } from "./choice-list-question";
import { DropdownQuestionUI } from "./dropdown-question";
import { LinearScaleQuestionUI } from "./linear-scale-question";
import { MatrixQuestionUI } from "./matrix-question";
import { OpenQuestionUI } from "./open-question";
import { YesNoQuestionUI } from "./yes-no-question";

/**
 * Props for rendering a single form question.
 */
interface Props {
  question: FormQuestionProps;
  isSubQuestion?: boolean;
}

/**
 * Renders a question title, the corresponding UI, and optional help/observations.
 */
export function FormQuestion({ question, isSubQuestion = false }: Props) {
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [observationText, setObservationText] = useState("");

  /**
   * Selects the appropriate question UI based on type.
   */
  const renderQuestionUI = () => {
    switch (question.type) {
      case "open":
        return <OpenQuestionUI />;
      case "yes_no":
        return <YesNoQuestionUI question={question} />;
      case "choice_list":
        return <ChoiceListQuestionUI question={question} />;
      case "dropdown":
        return <DropdownQuestionUI question={question} />;
      case "linear_scale":
        return <LinearScaleQuestionUI question={question} />;
      case "matrix":
        return <MatrixQuestionUI question={question} />;
      default:
        return null;
    }
  };

  const content = (
    <>
      <View className="self-stretch px-3.5 py-2.5 rounded-[10px] flex flex-row justify-between items-center gap-2.5">
        <Text className="flex-1 text-white text-default-2">
          {question.title}
        </Text>

        {question.helpText && (
          <Pressable
            onPress={() => setIsHelpModalVisible(true)}
            className="w-8 h-8 rounded-full items-center justify-center bg-secondary/15 active:opacity-60"
          >
            <HelpCircle color={colors.secondary} size={20} />
          </Pressable>
        )}
      </View>
      
      {renderQuestionUI()}

      {question.allowObservation && (
        <View className="self-stretch mt-4 border-t border-outline pt-4">
          <Text className="text-default-3 text-muted mb-2">Observações (opcional)</Text>
          <View className="flex flex-row items-end gap-3">
            <DefaultTextInput
              multiline
              value={observationText}
              onChangeText={setObservationText}
              className="flex-1 min-h-[44px]"
              placeholder="Adicione uma observação"
            />
            <Pressable
              // TODO: Integrar áudio
              onPress={() => {}}
              className="w-[44px] h-[44px] bg-level1 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline justify-center items-center active:opacity-60"
            >
              <Mic color={colors.muted} size={20} />
            </Pressable>
          </View>
        </View>
      )}
    </>
  );

  return (
    <>
      {isSubQuestion ? (
        <View className="self-stretch flex flex-col gap-2 mt-4">{content}</View>
      ) : (
        <View className="w-full p-[15px] bg-level2 rounded-2xl shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline flex flex-col justify-start items-start gap-2">
          {content}
        </View>
      )}

      <Modal
        visible={isHelpModalVisible}
        onRequestClose={() => setIsHelpModalVisible(false)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/60 justify-center p-6">
          <View className="bg-level2 border border-outline rounded-2xl max-h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between p-5 border-b border-outline">
              <Text className="text-header-3 text-white flex-1 pr-4">{question.title}</Text>
              <Pressable onPress={() => setIsHelpModalVisible(false)} className="p-1 active:opacity-60">
                <X color={colors.muted} size={24} />
              </Pressable>
            </View>
            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              <Text className="text-default-2 text-muted leading-6 pb-6">
                {question.helpText}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
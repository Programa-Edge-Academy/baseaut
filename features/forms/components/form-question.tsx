import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { HelpCircle, X } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
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
  /** Current answer value supplied by the parent. */
  value?: any;
  /** Called with the new answer value. */
  onChange?: (val: any) => void;
}

/**
 * Renders a question title, the corresponding UI, and optional help/observations.
 */
export function FormQuestion({
  question,
  isSubQuestion = false,
  value,
  onChange,
}: Props) {
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [observationText, setObservationText] = useState("");

  const renderSubQuestion = (subQuestion: FormQuestionProps): ReactNode => (
    <FormQuestion question={subQuestion} isSubQuestion={true} />
  );

  /** Selects the appropriate question UI based on the question type. */
  const renderQuestionUI = () => {
    switch (question.type) {
      case "open":
        return (
          <OpenQuestionUI
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "yes_no":
        return (
          <YesNoQuestionUI
            question={question}
            value={value}
            onChange={onChange}
            renderSubQuestion={renderSubQuestion}
          />
        );
      case "choice_list":
        return (
          <ChoiceListQuestionUI
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "dropdown":
        return (
          <DropdownQuestionUI
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "linear_scale":
        return (
          <LinearScaleQuestionUI
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "matrix":
        return (
          <MatrixQuestionUI
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  const content = (
    <>
    <View className="self-stretch px-0.7 rounded-[10px] flex flex-row items-center gap-2.5">
      <View className="flex-1 min-h-[44px] px-3.5 py-2.5 justify-center">
        <Text className="text-white text-default-2">
          {question.title}
        </Text>
      </View>

      {question.helpText && (
        <Pressable
          onPress={() => setIsHelpModalVisible(true)}
          className="w-11 h-11 rounded-full items-center justify-center bg-secondary/15 active:opacity-60 shrink-0"
        >
          <HelpCircle color={colors.secondary} size={20} />
        </Pressable>
      )}
    </View>

      {renderQuestionUI()}

      {question.allowObservation && (
        <View className="self-stretch mt-4 border-t border-outline pt-4">
          <Text className="text-default-3 text-muted mb-2">
            Observações (opcional)
          </Text>
          <View className="flex flex-row items-end gap-3">
            <DefaultTextInput
              multiline
              value={observationText}
              onChangeText={setObservationText}
              className="flex-1 min-h-[44px]"
              placeholder="Adicione uma observação"
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <>
      {isSubQuestion ? (
        <View className="self-stretch flex flex-col mt-4">{content}</View>
      ) : (
        <View className="w-full p-[15px] bg-level2 rounded-2xl border border-outline flex flex-col justify-start items-start">
          {content}
        </View>
      )}

      <AppModal
        visible={isHelpModalVisible}
        onRequestClose={() => setIsHelpModalVisible(false)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/60 justify-center p-6">
          <View className="bg-level2 border border-outline rounded-2xl max-h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between p-5 border-b border-outline">
              <Text className="text-header-3 text-white flex-1 pr-4">
                {question.title}
              </Text>
              <Pressable
                onPress={() => setIsHelpModalVisible(false)}
                className="p-1 active:opacity-60"
              >
                <X color={colors.muted} size={24} />
              </Pressable>
            </View>
            <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
              <Markdown style={helpMarkdownStyles}>
                {question.helpText}
              </Markdown>
            </ScrollView>
          </View>
        </View>
      </AppModal>
    </>
  );
}

const helpMarkdownStyles = {
  body: {
    color: colors.muted,
    fontFamily: "Inter-Medium",
    fontSize: 14,
    lineHeight: 22,
    paddingBottom: 24,
  },
  heading1: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 20, marginBottom: 8, marginTop: 8 },
  heading2: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 18, marginBottom: 8, marginTop: 8 },
  heading3: { color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 16, marginBottom: 6, marginTop: 8 },
  strong: { color: "#FFFFFF", fontFamily: "Inter-Bold" },
  em: { fontStyle: "italic" as const },
  bullet_list: { marginBottom: 4 },
  ordered_list: { marginBottom: 4 },
  list_item: { marginBottom: 4 },
  blockquote: {
    backgroundColor: colors.level1,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 4,
  },
  code_inline: {
    backgroundColor: colors.outline,
    color: colors.extra,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: colors.outline,
    color: colors.extra,
    borderRadius: 8,
    padding: 8,
  },
  hr: { backgroundColor: colors.outline, height: 1, marginVertical: 12 },
};

import { colors } from "@/assets/colors";
import { ChevronDown } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { DropdownModal } from "../../../components/dropdown-modal";
import { DropdownQuestion } from "../types";

/**
 * Props for a dropdown question UI.
 */
interface Props {
  question: DropdownQuestion;
}

/**
 * Renders a dropdown question with optional "other" input.
 */
export function DropdownQuestionUI({ question }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  const [modalLayout, setModalLayout] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const options = question.allowOther
    ? [...question.options, "Outro"]
    : question.options;

  /**
   * Handles selecting an option and resets "other" when cleared.
   */
  const handleSelect = (opt: string) => {
    if (opt === "") {
      setSelected(null);
      setOtherText("");
    } else {
      setSelected(opt);
    }
  };

  /**
   * Measures the trigger button and opens the dropdown modal.
   */
  const openModal = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setModalLayout({ top: pageY, left: pageX, width });
      setIsOpen(true);
    });
  };

  return (
    <View className="self-stretch flex flex-col mt-2">
      <View ref={buttonRef} collapsable={false} className="self-stretch">
        <Pressable
          onPress={openModal}
          className="self-stretch px-4 min-h-[44px] bg-level1 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline flex flex-row justify-between items-center"
        >
          <Text
            className={
              selected
                ? "text-white text-default-2"
                : "text-muted text-default-2"
            }
          >
            {selected || "Selecione aqui"}
          </Text>
          <ChevronDown color={colors.muted} size={20} />
        </Pressable>
      </View>

      <DropdownModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        options={options}
        selectedValue={selected}
        layout={modalLayout}
      />

      {selected === "Outro" && (
        <DefaultTextInput
          value={otherText}
          onChangeText={setOtherText}
          placeholder="Especifique..."
          className="mt-2 min-h-[44px]"
        />
      )}
    </View>
  );
}

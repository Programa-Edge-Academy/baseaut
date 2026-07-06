import { useI18n } from "@/features/settings/contexts/i18n-context";
import { Pressable, Text, View } from "react-native";
import { translateSubtag, translateTag } from "../utils/tag-labels";

/** Selection behaviour for a {@link TagGroup}. */
export type TagGroupMode = "single" | "multiple";

/** Props for {@link TagGroup}. */
export type TagGroupProps = {
  availableTags: string[];
  availableSubtags: string[];
  mode: TagGroupMode;
  selectedTags: string[];
  /** Active subtags keyed by their parent tag. */
  selectedSubtags: Record<string, string[]>;
  onChangeTags: (tags: string[]) => void;
  onChangeSubtags: (subtags: Record<string, string[]>) => void;
};

/**
 * Grouped tag/subtag selector. Each tag is a card; selecting a subtag also
 * selects its parent tag. Supports single- or multiple-tag selection.
 */
export function TagGroup({
  availableTags,
  availableSubtags,
  mode,
  selectedTags,
  selectedSubtags,
  onChangeTags,
  onChangeSubtags,
}: TagGroupProps) {
  const { t } = useI18n();
  const toggleTag = (label: string) => {
    if (mode === "single") {
      onChangeTags(selectedTags.includes(label) ? [] : [label]);
    } else {
      onChangeTags(
        selectedTags.includes(label)
          ? selectedTags.filter((t) => t !== label)
          : [...selectedTags, label]
      );
    }
  };

  const toggleSubtag = (subLabel: string, parentTag: string) => {
    if (!selectedTags.includes(parentTag)) {
      if (mode === "single") {
        onChangeTags([parentTag]);
      } else {
        onChangeTags([...selectedTags, parentTag]);
      }
    }

    const parentSubs = selectedSubtags[parentTag] || [];
    onChangeSubtags({
      ...selectedSubtags,
      [parentTag]: parentSubs.includes(subLabel)
        ? parentSubs.filter((s) => s !== subLabel)
        : [...parentSubs, subLabel],
    });
  };

  return (
    <View className="gap-[10px] w-full">
      {availableTags.map((tagLabel) => {
        const isTagActive = selectedTags.includes(tagLabel);
        return (
          <Pressable
            key={tagLabel}
            onPress={() => toggleTag(tagLabel)}
            className={`min-h-[80px] rounded-[15px] border ${
              isTagActive
                ? "bg-level2 border-primary"
                : "bg-level1 border-outline"
            } justify-center pl-4 pr-4 py-3 relative`}
          >
            <Text className="text-content text-[14px] leading-[20px] font-medium mb-1.5">
              {translateTag(tagLabel, t)}
            </Text>
            <View className="flex-row flex-wrap gap-[10px]">
              {availableSubtags.map((subLabel) => {
                const isSubtagActive =
                  isTagActive && (selectedSubtags[tagLabel] || []).includes(subLabel);
                return (
                  <Pressable
                    key={subLabel}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleSubtag(subLabel, tagLabel);
                    }}
                    className={`px-[10px] py-[3px] rounded-[15px] border ${
                      isSubtagActive
                        ? "bg-primary border-primary"
                        : "bg-level2 border-outline"
                    }`}
                  >
                    <Text className="text-content text-[12px] leading-[20px] font-medium">
                      {translateSubtag(subLabel, t)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

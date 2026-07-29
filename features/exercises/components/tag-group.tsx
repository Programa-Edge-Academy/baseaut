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
  /** Most tags selectable at once in `multiple` mode. Unlimited when omitted. */
  maxTags?: number;
  /** Most subtags selectable per tag. Unlimited when omitted. */
  maxSubtagsPerTag?: number;
};

/**
 * Grouped tag/subtag selector. Each tag is a card; selecting a subtag also
 * selects its parent tag. Supports single- or multiple-tag selection.
 *
 * @remarks
 * Deselecting a tag also drops the subtags picked under it, so the emitted map
 * never carries subtags for a tag that is no longer selected.
 */
export function TagGroup({
  availableTags,
  availableSubtags,
  mode,
  selectedTags,
  selectedSubtags,
  onChangeTags,
  onChangeSubtags,
  maxTags,
  maxSubtagsPerTag,
}: TagGroupProps) {
  const { t } = useI18n();

  const dropSubtagsOf = (label: string) => {
    const { [label]: _removed, ...rest } = selectedSubtags;
    onChangeSubtags(rest);
  };

  const toggleTag = (label: string) => {
    const isSelected = selectedTags.includes(label);

    if (mode === "single") {
      onChangeTags(isSelected ? [] : [label]);
      if (isSelected) dropSubtagsOf(label);
      else onChangeSubtags({ [label]: selectedSubtags[label] ?? [] });
      return;
    }

    if (isSelected) {
      onChangeTags(selectedTags.filter((tag) => tag !== label));
      dropSubtagsOf(label);
      return;
    }
    if (maxTags !== undefined && selectedTags.length >= maxTags) return;
    onChangeTags([...selectedTags, label]);
  };

  const toggleSubtag = (subLabel: string, parentTag: string) => {
    const parentSelected = selectedTags.includes(parentTag);

    if (!parentSelected) {
      if (mode === "single") {
        onChangeTags([parentTag]);
        onChangeSubtags({ [parentTag]: [subLabel] });
        return;
      }
      // Selecting a subtag pulls its parent in, but not past the tag limit.
      if (maxTags !== undefined && selectedTags.length >= maxTags) return;
      onChangeTags([...selectedTags, parentTag]);
    }

    const parentSubs = selectedSubtags[parentTag] || [];
    const isActive = parentSubs.includes(subLabel);
    if (
      !isActive &&
      maxSubtagsPerTag !== undefined &&
      parentSubs.length >= maxSubtagsPerTag
    ) {
      return;
    }

    onChangeSubtags({
      ...selectedSubtags,
      [parentTag]: isActive
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

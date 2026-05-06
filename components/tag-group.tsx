import { View } from "react-native";
import { ExerciseTag, TagProps } from "./exercise-tag";

export type TagGroupProps = {
  tags: TagProps[];
  onAddTag: () => void;
};

export function TagGroup({ tags, onAddTag }: TagGroupProps) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {tags.map((tag) => (
        <ExerciseTag
          key={tag.label}
          label={tag.label}
          isActive={tag.isActive}
          onPress={tag.onPress}
          height={tag.height}
          borderRadius={tag.borderRadius}
        />
      ))}
      <ExerciseTag label="+" isActive onPress={onAddTag} />
    </View>
  );
}

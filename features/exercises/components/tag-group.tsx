import { Pressable, Text, View } from "react-native";

export type SubtagProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

export type TagProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  subtags: SubtagProps[];
};

export type TagGroupProps = {
  tags: TagProps[];
  onAddTag?: () => void; // Keeping for backwards compatibility if needed
};

export function TagGroup({ tags }: TagGroupProps) {
  return (
    <View className="gap-[10px] w-full">
      {tags.map((tag) => (
        <Pressable
          key={tag.label}
          onPress={tag.onPress}
          className={`h-[80px] rounded-[15px] border ${
            tag.isActive
              ? "bg-level2 border-primary"
              : "bg-level1 border-outline"
          } justify-center pl-4 relative`}
        >
          <Text className="text-white text-[14px] leading-[20px] font-medium mb-1.5">
            {tag.label}
          </Text>
          <View className="flex-row gap-[10px]">
            {tag.subtags.map((subtag) => (
              <Pressable
                key={subtag.label}
                onPress={(e) => {
                  e.stopPropagation();
                  subtag.onPress();
                }}
                className={`px-[10px] py-[3px] rounded-[15px] border ${
                  subtag.isActive
                    ? "bg-primary border-primary"
                    : "bg-level2 border-outline"
                }`}
              >
                <Text className="text-white text-[12px] leading-[20px] font-medium">
                  {subtag.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

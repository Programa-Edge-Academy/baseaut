import { colors } from "@/assets/colors";
import { CardMenu } from "@/components/card-menu";
import { MoreVertical, User } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface StudentItemProps {
  name: string;
  age: number;
  weight: number;
  height: number;
  waist: number;
  supportLevel: string;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function StudentItem({ 
  name, 
  age, 
  weight, 
  height, 
  waist,
  supportLevel, 
  onEdit, 
  onRemove 
}: StudentItemProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ top: 0, left: 0, width: 0 });

  const handlePress = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMenuLayout({ top: pageY + height, left: pageX, width });
      setMenuVisible(true);
    });
  };

  const formatSupportLevel = (level: string) => {
    if (level === "nivel_1") return "TEA nível 1";
    if (level === "nivel_2") return "TEA nível 2";
    if (level === "nivel_3") return "TEA nível 3";
    return level;
  };
  return (
    <View 
      className="mb-4 h-20 w-full flex-row items-center justify-between rounded-2xl border border-outline bg-level2 px-3.5" 
      style={{ zIndex: menuVisible ? 10 : 1 }}
    >
      <View className="flex-1 flex-row items-center gap-3.5 pr-2">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-level1">
          <User size={20} color={colors.muted} />
        </View>
        
        <View className="flex-1 justify-center gap-0.5">
          <Text className="text-base font-medium text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-sm font-medium text-muted" numberOfLines={1}>
            {age} anos · {weight}kg · {height}cm · {formatSupportLevel(supportLevel)}
          </Text>
        </View>
      </View>

      <View className="relative z-50">
        <Pressable
          ref={buttonRef}
          onPress={handlePress}
          className="h-10 w-10 items-center justify-center active:opacity-60"
        >
          <MoreVertical size={24} color={colors.muted} />
        </Pressable>

        <CardMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          layout={menuLayout}
          onEdit={() => {
            setMenuVisible(false);
            if (onEdit) onEdit();
          }}
          onDelete={() => {
            setMenuVisible(false);
            if (onRemove) onRemove();
          }}

        />
      </View>
    </View>
  );
}
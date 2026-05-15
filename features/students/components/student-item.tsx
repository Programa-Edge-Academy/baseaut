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

export function StudentItem({ name, age, weight, height, waist, supportLevel, onEdit, onRemove }: StudentItemProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ top: 0, left: 0, width: 0 });

  const handlePress = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMenuLayout({ top: pageY + height, left: pageX, width });
      setMenuVisible(true);
    });
  };

  return (
    <View className="mb-4 w-full flex-row items-center justify-between rounded-2xl bg-level2 p-4 shadow-lg" style={{ zIndex: menuVisible ? 10 : 1 }}>
      <View className="flex-1 flex-row items-center gap-4">
        {/* Avatar */}
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-extra/10">
          <User size={28} color={colors.extra} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white" numberOfLines={1}>{name}</Text>
          <Text className="mt-1 text-sm font-medium text-placeholder">
            {age} anos • {weight}kg • Estatura: {height}cm • Cintura: {waist}cm
          </Text>
          <View className="mt-1 self-start rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-xs font-bold text-primary">
              {supportLevel.replace("Transtorno do Espectro Autista ", "")}
            </Text>
          </View>
        </View>
      </View>

      <View className="relative z-50">
        <Pressable
          ref={buttonRef}
          onPress={handlePress}
          className="ml-2 h-10 w-10 items-center justify-center active:opacity-60"
        >
          <MoreVertical size={24} color={colors.placeholder} />
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

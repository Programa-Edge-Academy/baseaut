import React, { useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
// Importando o ícone (Exemplo com Lucide, substitua pelo seu SVG se preferir)
import { Eye, EyeOff } from "lucide-react-native";
import { colors } from "@/assets/colors";

type PasswordInputProps = TextInputProps & {
  className?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export function PasswordInput({
  className,
  containerStyle,
  inputStyle,
  ...rest
}: PasswordInputProps) {
  // Estado para controlar a visibilidade da senha
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View
      className={`relative h-11 w-full flex-row items-center rounded-[15px] border border-outline bg-level1 px-4 ${className ?? ""}`}
      style={containerStyle}
    >
      <TextInput
        className={`flex-1 pr-10 text-default-2 leading-5 text-white ${inputStyle ? "" : ""}`}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={!isPasswordVisible}
        style={inputStyle}
        {...rest}
      />

      <Pressable
        onPress={togglePasswordVisibility}
        className="absolute right-3"
        style={{ padding: 6 }}
      >
        {isPasswordVisible ? (
          <EyeOff size={20} color={colors.placeholder} />
        ) : (
          <Eye size={20} color={colors.placeholder} />
        )}
      </Pressable>
    </View>
  );
}

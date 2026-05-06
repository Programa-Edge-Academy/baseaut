import React, { useState } from "react";
import { TextInput, View, TextInputProps, ViewStyle, TextStyle, Pressable } from "react-native";
// Importando o ícone (Exemplo com Lucide, substitua pelo seu SVG se preferir)
import { Eye, EyeOff } from "lucide-react-native";

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
      className={`h-[44px] w-[342px] flex-row items-center rounded-[15px] border border-[#2B303B] bg-[#14181F] px-4 ${className ?? ""}`}
      style={containerStyle}
    >
      <TextInput
        className={`flex-1 text-[14px] font-medium text-white ${inputStyle ? "" : ""}`}
        placeholderTextColor="#465460"
        secureTextEntry={!isPasswordVisible}
        style={inputStyle}
        {...rest}
      />
      
      <Pressable onPress={togglePasswordVisibility} className="ml-2">
        {isPasswordVisible ? (
          <EyeOff size={20} color="#465460" />
        ) : (
          <Eye size={20} color="#465460" />
        )}
      </Pressable>
    </View>
  );
}
import React, { useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { colors } from "@/assets/colors";

type PasswordInputProps = TextInputProps & {
  className?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  outLineBorderClass?: string;
};

export function PasswordInput({
  className,
  containerStyle,
  inputStyle,
  outLineBorderClass = "border-outline",
  ...rest
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View
      className={`relative h-11 w-full flex-row items-center border bg-level1 ${className} ${outLineBorderClass}`}
      style={containerStyle}
    >
      <TextInput
        className={`flex-1 pr-10 text-default-2 leading-5 text-white rounded-[15px] py-2.5 px-3.5`}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={!isPasswordVisible}
        style={inputStyle}
        {...rest}
      />

      <Pressable
        onPress={togglePasswordVisibility}
        className="absolute right-3"
        style={{ padding: 3.5 }}
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

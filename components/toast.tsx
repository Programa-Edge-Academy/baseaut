import { colors } from "@/assets/colors";
import { Check, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export type ToastMode = "success" | "error";

export interface ToastProps {
  visible: boolean;
  mode: ToastMode;
  title: string;
  description?: string;
  onHide?: () => void;
}

export function Toast({
  visible,
  mode,
  title,
  description,
  onHide,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 20,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (onHide) onHide();
          });
        }, 3000);
      });
    }
  }, [visible, opacity, translateY, onHide]);

  if (!visible) return null;

  const isSuccess = mode === "success";

  // Fundo opaco (surface escura) com borda/ícone coloridos indicando sucesso/erro.
  const backgroundColor = colors.level2;
  const borderColor = isSuccess ? colors.secondary : colors.error;
  const titleColor = isSuccess ? colors.secondary : colors.error;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {isSuccess ? (
          <Check size={24} color={colors.secondary} strokeWidth={2} />
        ) : (
          <X size={24} color={colors.error} strokeWidth={2} />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 9999,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 2,
  },
  title: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
});
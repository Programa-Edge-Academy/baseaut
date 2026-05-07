import React, { useState } from "react";
import { Pressable, PressableProps, Animated, GestureResponderEvent } from "react-native";

export interface RipplePressableProps extends Omit<PressableProps, 'children'> {
  rippleColor?: string;
  className?: string;
  children?: React.ReactNode; 
}

export function RipplePressable({
  rippleColor = "rgba(255, 255, 255, 0.3)",
  className,
  children,
  ...rest
}: RipplePressableProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; anim: Animated.Value }[]>([]);

  const handlePressIn = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const newRipple = {
      id: Date.now() + Math.random(),
      x: locationX,
      y: locationY,
      anim: new Animated.Value(0),
    };
    
    setRipples((prev) => [...prev, newRipple]);

    Animated.timing(newRipple.anim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    });

    if (rest.onPressIn) rest.onPressIn(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      className={`overflow-hidden ${className ?? ""}`}
      {...rest}
    >
      {ripples.map((ripple) => (
        <Animated.View
          key={ripple.id}
          style={{
            position: "absolute",
            top: ripple.y - 100,
            left: ripple.x - 100,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: rippleColor,
            pointerEvents: "none",
            transform: [{
              scale: ripple.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 2.5],
              }),
            }],
            opacity: ripple.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        />
      ))}

      {children}
    </Pressable>
  );
}
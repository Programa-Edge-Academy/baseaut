import { GripVertical } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/assets/colors";

export type DraggableItem = { id: string; name: string };

const ITEM_HEIGHT = 56;
const GAP = 8;
const STEP = ITEM_HEIGHT + GAP;
const SPRING = { damping: 20, stiffness: 200, mass: 0.5 };
const LONG_PRESS_MS = 50;
const RIPPLE_TIME_MULTIPLIER = 4;
const RIPPLE_DURATION = LONG_PRESS_MS * RIPPLE_TIME_MULTIPLIER;

function clamp(val: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(val, min), max);
}

function shiftPositions(
  positions: Record<string, number>,
  from: number,
  to: number,
): Record<string, number> {
  "worklet";
  const result: Record<string, number> = {};
  for (const id in positions) {
    const p = positions[id];
    if (p === from) {
      result[id] = to;
    } else if (from < to && p > from && p <= to) {
      result[id] = p - 1;
    } else if (from > to && p < from && p >= to) {
      result[id] = p + 1;
    } else {
      result[id] = p;
    }
  }
  return result;
}

interface DraggableRowProps {
  item: DraggableItem;
  index: number;
  itemCount: number;
  positions: SharedValue<Record<string, number>>;
  activeId: SharedValue<string | null>;
  onFinish: (positions: Record<string, number>) => void;
}

function DraggableRow({
  item,
  index,
  itemCount,
  positions,
  activeId,
  onFinish,
}: DraggableRowProps) {
  const startY = useSharedValue(0);
  const translateY = useSharedValue(index * STEP);
  const [displayPos, setDisplayPos] = useState(index);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  const rippleProgress = useSharedValue(0);
  // Diâmetro calculado por toque (cobre o canto mais distante) e largura medida.
  const rippleDiameter = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  useAnimatedReaction(
    () => positions.value[item.id],
    (pos, prev) => {
      if (pos == null) return;
      if (pos !== prev) runOnJS(setDisplayPos)(pos);
      if (activeId.value !== item.id) {
        translateY.value = withSpring(pos * STEP, SPRING);
      }
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .maxPointers(1)
    .onBegin((e) => {
      // Raio = distância até o canto mais distante, garantindo cobrir o card
      // inteiro a partir de qualquer ponto de toque (independe da largura).
      const w = cardWidth.value;
      const h = ITEM_HEIGHT;
      const x = e.x;
      const y = e.y;
      const r = Math.max(
        Math.sqrt(x * x + y * y),
        Math.sqrt((w - x) * (w - x) + y * y),
        Math.sqrt(x * x + (h - y) * (h - y)),
        Math.sqrt((w - x) * (w - x) + (h - y) * (h - y)),
      );
      rippleX.value = x;
      rippleY.value = y;
      rippleDiameter.value = r * 2;
      rippleProgress.value = 0;
      rippleProgress.value = withTiming(1, { duration: RIPPLE_DURATION });
    })
    .onStart(() => {
      activeId.value = item.id;
      startY.value = positions.value[item.id] * STEP;
    })
    .onUpdate((e) => {
      translateY.value = clamp(
        startY.value + e.translationY,
        0,
        (itemCount - 1) * STEP,
      );
      const hoverPos = Math.round(translateY.value / STEP);
      const currentPos = positions.value[item.id];
      if (hoverPos !== currentPos) {
        positions.value = shiftPositions(positions.value, currentPos, hoverPos);
      }
    })
    .onEnd(() => {
      translateY.value = withSpring(
        positions.value[item.id] * STEP,
        SPRING,
        () => {
          activeId.value = null;
        },
      );
      runOnJS(onFinish)(positions.value);
    })
    .onFinalize(() => {
      rippleProgress.value = withTiming(0, { duration: 150 });
      if (activeId.value === item.id) activeId.value = null;
    });

  const animStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === item.id;
    return {
      position: "absolute" as const,
      left: 0,
      right: 0,
      top: 0,
      height: ITEM_HEIGHT,
      zIndex: isActive ? 10 : 1,
      transform: [{ translateY: translateY.value }],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: isActive ? 6 : 0 },
      shadowOpacity: isActive ? 0.25 : 0,
      shadowRadius: isActive ? 8 : 0,
      elevation: isActive ? 6 : 0,
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    const d = rippleDiameter.value;
    return {
      position: "absolute" as const,
      left: rippleX.value - d / 2,
      top: rippleY.value - d / 2,
      width: d,
      height: d,
      borderRadius: d / 2,
      backgroundColor: colors.muted,
      opacity: 0.25 * rippleProgress.value,
      transform: [{ scale: rippleProgress.value }],
    };
  });

  return (
    <Animated.View style={animStyle}>
      <View
        onLayout={(e) => {
          cardWidth.value = e.nativeEvent.layout.width;
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.outline,
          backgroundColor: colors.level1,
          borderRadius: 10,
          height: ITEM_HEIGHT,
          paddingHorizontal: 12,
          gap: 12,
          overflow: "hidden",
        }}
      >
        <Animated.View pointerEvents="none" style={rippleStyle} />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={{
              height: ITEM_HEIGHT,
              justifyContent: "center",
              paddingHorizontal: 14,
              marginLeft: -12,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 20 }}
          >
            <GripVertical color={colors.muted} size={20} />
          </Animated.View>
        </GestureDetector>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontFamily: "Inter-Medium",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {displayPos + 1}. {item.name}
        </Text>
      </View>
    </Animated.View>
  );
}

interface DraggableListProps {
  items: DraggableItem[];
  onReorder: (items: DraggableItem[]) => void;
  onDragActiveChange?: (active: boolean) => void;
}

export function DraggableList({
  items,
  onReorder,
  onDragActiveChange,
}: DraggableListProps) {
  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(items.map((item, i) => [item.id, i])),
  );
  const activeId = useSharedValue<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const notifyActive = useCallback(
    (active: boolean) => {
      onDragActiveChange?.(active);
    },
    [onDragActiveChange],
  );

  useAnimatedReaction(
    () => activeId.value,
    (cur, prev) => {
      if (cur !== prev) runOnJS(notifyActive)(cur !== null);
    },
  );

  useEffect(() => {
    const currentIds = Object.keys(positions.value).sort().join(",");
    const newIds = [...items.map((i) => i.id)].sort().join(",");
    if (currentIds !== newIds) {
      positions.value = Object.fromEntries(items.map((item, i) => [item.id, i]));
    }
  }, [items]);

  const handleFinish = useCallback(
    (finalPositions: Record<string, number>) => {
      const sorted = [...itemsRef.current].sort(
        (a, b) => finalPositions[a.id] - finalPositions[b.id],
      );
      onReorder(sorted);
    },
    [onReorder],
  );

  const containerHeight = items.length * STEP - GAP;

  return (
    <GestureHandlerRootView style={{ height: containerHeight }}>
      {items.map((item, index) => (
        <DraggableRow
          key={item.id}
          item={item}
          index={index}
          itemCount={items.length}
          positions={positions}
          activeId={activeId}
          onFinish={handleFinish}
        />
      ))}
    </GestureHandlerRootView>
  );
}

import React, { memo, useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface TypingIndicatorProps {
  name?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
  name = "Jia",
}: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  const translateY = (dot: Animated.Value) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{name} is typing</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: translateY(dot1) }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: translateY(dot2) }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: translateY(dot3) }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    marginVertical: 8,
    marginHorizontal: 12,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.dark.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    ...theme.shadows.sm,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 8,
    fontStyle: "italic",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[400],
  },
});

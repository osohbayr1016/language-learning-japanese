import React, { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "../../../theme";

type Props = {
  flipped: boolean;
  onPress: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
  style?: ViewStyle;
};

/** Урт утга орж дамжрахгүй, дээд талын ханз клип хийхгүй. */
function FaceScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.faceScroll}
      contentContainerStyle={styles.faceScrollContent}
      showsVerticalScrollIndicator
      nestedScrollEnabled
      bounces
    >
      {children}
    </ScrollView>
  );
}

export function FlipCard({ flipped, onPress, front, back, style }: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: flipped ? 180 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [flipped, rotation]);

  const frontRotate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });
  const frontOpacity = rotation.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = rotation.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.face,
          {
            transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
            opacity: frontOpacity,
          },
        ]}
      >
        <FaceScroll>{front}</FaceScroll>
      </Animated.View>
      <Animated.View
        style={[
          styles.face,
          styles.absolute,
          {
            transform: [{ perspective: 1000 }, { rotateY: backRotate }],
            opacity: backOpacity,
          },
        ]}
      >
        <FaceScroll>{back}</FaceScroll>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 320,
    // A card taller than this is just empty white; the rating controls then
    // sit off-screen on a phone and the whole page has to scroll.
    maxHeight: 440,
    width: "100%",
    backgroundColor: "transparent",
  },
  face: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: 0,
    backfaceVisibility: "hidden",
    overflow: "hidden",
    ...shadows.md,
  },
  absolute: { ...StyleSheet.absoluteFillObject },
  faceScroll: { flex: 1, width: "100%" },
  faceScrollContent: {
    flexGrow: 1,
    width: "100%",
    padding: spacing.xl,
    paddingTop: spacing.xl + 6,
    paddingBottom: spacing.xl + 4,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme';

/** Brand success tone — was a leftover Duolingo green. */
const GREEN = colors.success;

/** Increment `stamp` on each successful pass to replay the animation. */
export function SpeakSuccessCelebration({ stamp }: { stamp: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (stamp < 1) return;
    scale.value = 0;
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 140 });
    scale.value = withSequence(
      withTiming(1.14, { duration: 340, easing: Easing.out(Easing.exp) }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
    );
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 240 });
      scale.value = withTiming(0.9, { duration: 240 });
    }, 820);
    return () => clearTimeout(t);
  }, [stamp]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.35,
    transform: [{ scale: scale.value * 1.45 }],
  }));

  const mainStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (stamp < 1) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={mainStyle}>
          <Ionicons name="checkmark-circle" size={92} color={GREEN} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: GREEN,
  },
});

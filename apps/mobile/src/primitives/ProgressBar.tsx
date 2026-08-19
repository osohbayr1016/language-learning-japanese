import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, motion, radius } from '../theme';

type Props = {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  value,
  max = 100,
  height = 8,
  color = colors.brand.primary,
  trackColor = colors.bg.elevated,
  rounded = true,
  style,
}: Props) {
  const pct = Math.min(1, Math.max(0, value / max));
  const progress = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: motion.duration.lazy,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, progress]);

  const widthInterp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: rounded ? radius.full : 0,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterp,
            backgroundColor: color,
            borderRadius: rounded ? radius.full : 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});

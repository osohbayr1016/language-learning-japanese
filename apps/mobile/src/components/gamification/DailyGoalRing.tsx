import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, motion, typography } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  current: number;
  goal: number;
  size?: number;
  thickness?: number;
};

export function DailyGoalRing({ current, goal, size = 96, thickness = 10 }: Props) {
  const pct = Math.min(1, current / Math.max(1, goal));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const done = pct >= 1;

  // The ring used to snap straight to its final value, so daily progress never
  // felt earned. It now sweeps in from empty whenever the number changes.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: motion.duration.lazy,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, progress]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [c, 0],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.bg.elevated}
          strokeWidth={thickness}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? colors.success : colors.brand.primary}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, done ? styles.valueDone : null]}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={styles.unit}>
          {current}/{goal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  value: { ...typography.heading.md, color: colors.text.primary },
  valueDone: { color: colors.success },
  unit: { ...typography.body.sm, color: colors.text.muted },
});

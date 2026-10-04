import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

const TIPS = [
  'Япон хэлэнд хирагана, катакана, канжи гэсэн гурван үндсэн бичгийн систем ашиглагдана.',
  'Өдөр бүр багахан давтах нь хамгийн үр дүнтэй.',
  'Хирагана, катаканагийн үндсэн тэмдэглэгээг сайн таньдаг бол N5 хичээл илүү хялбар болно.',
  'Шинэ үгийг жишээ өгүүлбэртэй нь хамт сурах нь илүү тогтоцтой.',
];

export function LoadingScreen() {
  const fill = useRef(new Animated.Value(0)).current;
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fill, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(fill, { toValue: 0.1, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, [fill]);

  const widthInterp = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '95%'],
  });

  return (
    <View style={styles.root}>
      <View style={styles.mascot}>
        <Ionicons name="leaf" size={64} color={colors.brand.primary} />
      </View>
      <Text style={styles.title}>Хичээл бэлдэж байна...</Text>
      <Text style={styles.tip}>{tip}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: widthInterp }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  mascot: {
    width: 140,
    height: 140,
    borderRadius: radius.full,
    backgroundColor: `${colors.brand.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading.lg, color: colors.text.primary, textAlign: 'center' },
  tip: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  barTrack: {
    width: '70%',
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.brand.primary, borderRadius: radius.full },
});

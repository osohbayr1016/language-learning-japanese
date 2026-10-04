import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export function InsightsHeader() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>ЯВЦ</Text>
      <Text style={styles.title}>Таны өсөлт</Text>
      <Text style={styles.subtitle}>
        Streak-аас илүү чухал нь аль чадвар чинь бодитоор сайжирч байгааг харах.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading.xl,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    maxWidth: 460,
  },
});

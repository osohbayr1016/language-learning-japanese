import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, tint, typography } from '../../theme';

type Props = {
  days: number | undefined | null;
  size?: 'sm' | 'md';
};

export function StreakFlame({ days, size = 'md' }: Props) {
  const d = days ?? 0;
  const iconSize = size === 'sm' ? 16 : 22;
  const fontSize = size === 'sm' ? 14 : 18;

  return (
    <View style={[styles.row, size === 'sm' ? styles.compact : styles.normal]}>
      <Ionicons name="flame" size={iconSize} color={colors.warning} />
      <Text style={[styles.text, { fontSize, color: d > 0 ? colors.warning : colors.text.muted }]}>
        {d}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tint(colors.warning, 0.12),
    borderRadius: radius.full,
    gap: 4,
  },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  normal: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  text: { ...typography.heading.sm },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../primitives';
import { colors, spacing, typography } from '../../theme';
import type { Stats, Streak } from '../../lib/api/user';

type Props = { stats: Stats; streak: Streak };

type StatIcon = React.ComponentProps<typeof Ionicons>['name'];

export function StatsGrid({ stats, streak }: Props) {
  const items: { label: string; value: number; icon: StatIcon }[] = [
    { label: 'Нийт XP', value: stats?.total_xp ?? 0, icon: 'trophy-outline' },
    { label: 'Сурсан үг', value: stats?.words_learned ?? 0, icon: 'book-outline' },
    { label: 'Эзэмшсэн', value: stats?.words_mastered ?? 0, icon: 'checkmark-done-outline' },
    { label: 'Сэргэлт', value: streak?.current_streak ?? 0, icon: 'flame-outline' },
  ];

  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <Card key={it.label} padding="md" style={styles.cell}>
          <Ionicons name={it.icon} size={22} color={colors.text.muted} style={styles.statIcon} />
          <Text style={styles.value}>{it.value}</Text>
          <Text style={styles.label}>{it.label}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cell: { flexBasis: '48%', flexGrow: 1, alignItems: 'center' },
  statIcon: { marginBottom: spacing.xs },
  value: { ...typography.heading.xl, color: colors.brand.primary },
  label: { ...typography.body.md, color: colors.text.secondary, marginTop: 2 },
});

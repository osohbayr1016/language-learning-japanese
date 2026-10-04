import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  streak: number;
  todayXp: number;
  goal: number;
};

export function LearnerStatusBar({ streak, todayXp, goal }: Props) {
  const safeGoal = Math.max(1, goal);
  const pct = Math.min(1, Math.max(0, todayXp / safeGoal));

  return (
    <View style={styles.row}>
      <View style={styles.stat}>
        <Ionicons name="flame" size={21} color={colors.warning} />
        <Text style={styles.statStrong}>{streak}</Text>
        <Text style={styles.statLabel}>өдөр</Text>
      </View>

      <View style={styles.progressGroup}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Өнөөдөр</Text>
          <Text style={styles.progressValue}>{todayXp}/{safeGoal} XP</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
      </View>

      <View style={styles.stat}>
        <Ionicons
          name={todayXp >= safeGoal ? 'checkmark-circle' : 'sparkles'}
          size={21}
          color={todayXp >= safeGoal ? colors.success : colors.brand.primary}
        />
        <Text style={styles.statStrong}>{todayXp >= safeGoal ? '✓' : Math.max(0, safeGoal - todayXp)}</Text>
        <Text style={styles.statLabel}>{todayXp >= safeGoal ? 'done' : 'XP'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    minWidth: 72,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.sm,
  },
  statStrong: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.body.xs,
    color: colors.text.muted,
  },
  progressGroup: { flex: 1 },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...typography.body.sm,
    fontWeight: '800',
    color: colors.text.primary,
  },
  progressValue: {
    ...typography.body.sm,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  track: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
});

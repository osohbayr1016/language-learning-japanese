import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../primitives';
import { DailyGoalRing, XpBar } from '../../components/gamification';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = {
  totalXp: number;
  goal: number;
};

export function DailyGoalCard({ totalXp, goal }: Props) {
  const todayProgress = totalXp % goal;
  const level = Math.floor(totalXp / Math.max(1, goal)) + 1;
  const levelGoal = level * goal;

  return (
    <Card padding="lg" variant="elevated" style={styles.card}>
      <View style={styles.row}>
        <DailyGoalRing current={todayProgress} goal={goal} />
        <View style={styles.right}>
          <Text style={styles.label}>{mn.home.dailyGoal}</Text>
          <Text style={styles.subtitle}>Өнөөдөр {todayProgress} XP цуглуулсан</Text>
          <View style={styles.bar}>
            <XpBar xp={totalXp} goal={levelGoal} label={`Түвшин ${level}`} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  right: { flex: 1, gap: spacing.xs },
  label: { ...typography.heading.md, color: colors.text.primary },
  subtitle: { ...typography.body.md, color: colors.text.secondary },
  bar: { marginTop: spacing.sm },
});

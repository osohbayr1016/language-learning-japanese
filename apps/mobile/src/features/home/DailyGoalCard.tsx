import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../primitives';
import { DailyGoalRing, XpBar } from '../../components/gamification';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = {
  todayXp: number;
  totalXp: number;
  goal: number;
};

export function DailyGoalCard({ todayXp, totalXp, goal }: Props) {
  const safeGoal = Math.max(1, goal);
  const todayProgress = Math.max(0, todayXp);
  const level = Math.floor(Math.max(0, totalXp) / safeGoal) + 1;
  const levelGoal = level * safeGoal;
  const completed = todayProgress >= safeGoal;

  return (
    <Card padding="lg" variant="elevated" style={styles.card}>
      <View style={styles.row}>
        <DailyGoalRing current={Math.min(todayProgress, safeGoal)} goal={safeGoal} />
        <View style={styles.right}>
          <Text style={styles.label}>{mn.home.dailyGoal}</Text>
          <Text style={styles.subtitle}>
            {completed
              ? `Өнөөдрийн зорилго биеллээ · ${todayProgress} XP`
              : `Өнөөдөр ${todayProgress}/${safeGoal} XP · ${safeGoal - todayProgress} XP үлдлээ`}
          </Text>
          <View style={styles.bar}>
            <XpBar xp={Math.max(0, totalXp)} goal={levelGoal} label={`Түвшин ${level}`} />
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

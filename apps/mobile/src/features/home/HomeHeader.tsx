import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StreakFlame } from '../../components/gamification';
import { colors, spacing, typography } from '../../theme';

type Props = { name: string; streak: number };

/** Time-aware greeting — a small cue that the page is live, not a static shell. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Сайхан амраарай';
  if (h < 12) return 'Өглөөний мэнд';
  if (h < 18) return 'Өдрийн мэнд';
  return 'Оройн мэнд';
}

export function HomeHeader({ name, streak }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.hello}>{greeting()},</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <StreakFlame days={streak} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  copy: { flex: 1 },
  hello: { ...typography.body.md, color: colors.text.muted },
  name: { ...typography.heading.lg, color: colors.text.primary },
});

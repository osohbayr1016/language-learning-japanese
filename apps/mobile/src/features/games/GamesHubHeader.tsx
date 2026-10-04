import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { useGamification } from '../../context/GamificationContext';

export function GamesHubHeader() {
  const { stats } = useGamification();
  const xp = stats?.total_xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const nextXp = level * 100;
  const progress = (xp % 100) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>{mn.games.hub}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>Түвшин {level}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{mn.games.hubSub}</Text>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{xp} / {nextXp} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.heading.xl, color: colors.text.primary },
  levelBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelBadgeText: {
    ...typography.body.sm,
    color: '#FFF',
    fontWeight: '800',
  },
  sub: { ...typography.body.md, color: colors.text.secondary, marginTop: 4 },
  progressContainer: {
    height: 8,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.body.xs,
    color: colors.text.muted,
    marginTop: 4,
    textAlign: 'right',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { Button, Screen } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { useGamification } from '../../context/GamificationContext';

type Props = {
  score: number;
  xp: number;
  durationSeconds: number;
  onPlayAgain: () => void;
};

export function GameOverScreen({ score, xp, durationSeconds, onPlayAgain }: Props) {
  const router = useRouter();
  const { stats } = useGamification();
  
  const currentTotalXp = stats?.total_xp ?? 0;
  // If stats already includes the new xp, previous was current - xp.
  // We'll just show current level state.
  const level = Math.floor(currentTotalXp / 100) + 1;
  const nextXp = level * 100;
  const progress = (currentTotalXp % 100) / 100;
  // Never claim a level-up without synced totals or a genuine level boundary.
  const isLevelUp = !!stats && xp > 0 &&
    Math.floor(Math.max(0, currentTotalXp - xp) / 100) < Math.floor(currentTotalXp / 100);

  return (
    <Screen>
      <View style={styles.center}>
        <Ionicons name="trophy" size={88} color={colors.warning} />
        <Text style={styles.headline}>{isLevelUp ? 'Level Up!' : mn.games.gameOver}</Text>
        
        <View style={styles.levelCard}>
          <Text style={styles.levelCardTitle}>Түвшин {level}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentTotalXp} / {nextXp} XP <Text style={{ color: colors.success }}>(+{xp})</Text>
          </Text>
        </View>

        <View style={styles.row}>
          <Stat value={score} label={mn.games.score} color={colors.accent.purple} />
          <Stat value={`${durationSeconds}s`} label="Хугацаа" color={colors.accent.teal} />
        </View>
        <Button label={mn.games.playAgain} onPress={onPlayAgain} style={{ marginTop: spacing.lg }} />
        <Button label={mn.common.back} variant="ghost" onPress={() => safeBack(router, '/(tabs)/games')} style={{ marginTop: spacing.sm }} />
      </View>
    </Screen>
  );
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  headline: { ...typography.heading.xl, color: colors.text.primary, marginBottom: spacing.md },
  levelCard: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelCardTitle: { ...typography.heading.md, color: colors.brand.primary, marginBottom: spacing.sm },
  progressContainer: {
    width: '100%',
    height: 12,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  row: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  stat: { alignItems: 'center' },
  value: { ...typography.heading.xl },
  label: { ...typography.body.md, color: colors.text.secondary, marginTop: 2 },
});

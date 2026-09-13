import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = {
  title: string;
  score: number;
  timeLeft?: number | null;
  /** Алхам болгон секундээр тоологч — тоглоомын хугацаа харагдуулах */
  elapsedSeconds?: number | null;
  progressLabel?: string;
  combo?: number;
  /** Дүрмийн дундуур шинээр эхлүүлэх */
  onRestart?: () => void;
};

function formatElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function GameHud({ title, score, timeLeft, elapsedSeconds, progressLabel, combo = 1, onRestart }: Props) {
  const router = useRouter();
  const isFever = combo > 2;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mn.common.back}
        onPress={() => safeBack(router, '/(tabs)/games')}
        hitSlop={12}
      >
        <Ionicons name="close" size={26} color={colors.text.secondary} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {progressLabel ? <Text style={styles.progress}>{progressLabel}</Text> : null}
      </View>
      <View style={styles.right}>
        {elapsedSeconds !== undefined && elapsedSeconds !== null ? (
          <View style={styles.chip}>
            <Ionicons name="timer-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.chipText}>{formatElapsed(elapsedSeconds)}</Text>
          </View>
        ) : null}
        {onRestart ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mn.games.playAgain}
            onPress={onRestart}
            hitSlop={12}
            style={styles.restartBtn}
          >
            <Ionicons name="refresh" size={22} color={colors.text.secondary} />
          </Pressable>
        ) : null}
        {timeLeft !== undefined && timeLeft !== null ? (
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={14} color={colors.warning} />
            <Text style={[styles.chipText, { color: colors.warning }]}>{timeLeft}s</Text>
          </View>
        ) : null}
        {combo > 1 ? (
          <View style={[styles.chip, isFever && styles.feverChip]}>
            <Ionicons name="flame" size={14} color={isFever ? '#FFF' : colors.warning} />
            <Text style={[styles.chipText, { color: isFever ? '#FFF' : colors.warning }]}>x{combo}</Text>
          </View>
        ) : null}
        <View style={styles.chip} accessibilityLabel={`${score} ${mn.games.score}`}>
          <Ionicons name="star" size={14} color={colors.accent.purple} />
          <Text style={[styles.chipText, { color: colors.accent.purple }]}>{score}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  center: { flex: 1 },
  title: { ...typography.heading.md, color: colors.text.primary },
  progress: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  right: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.bg.elevated,
  },
  chipText: { ...typography.body.sm, fontWeight: '700' },
  feverChip: {
    backgroundColor: colors.warning,
  },
  restartBtn: { padding: 4, justifyContent: 'center' },
});

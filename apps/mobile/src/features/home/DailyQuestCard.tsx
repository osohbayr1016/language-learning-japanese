import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../../primitives';
import { colors, radius, spacing, tint, typography } from '../../theme';
import type { StudyNextAction } from '../../lib/api/user';

type Props = {
  action: StudyNextAction | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
};

function iconFor(kind: StudyNextAction['kind'] | 'loading') {
  if (kind === 'review') return 'refresh-circle';
  if (kind === 'foundation') return 'text';
  if (kind === 'checkpoint') return 'trophy';
  if (kind === 'lesson') return 'school';
  if (kind === 'weak_skill') return 'fitness';
  return kind === 'loading' ? 'hourglass' : 'sparkles';
}

export function DailyQuestCard({ action, loading, error, onRetry }: Props) {
  const router = useRouter();

  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <View style={styles.iconBubble}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.warning} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>ӨНӨӨДРИЙН ХИЧЭЭЛ</Text>
          <Text style={styles.title}>Төлөвлөгөөг ачаалж чадсангүй</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{error}</Text>
          {onRetry ? (
            <Button
              label="Дахин оролдох"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={onRetry}
              style={styles.retry}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const plan = action ?? {
    kind: 'loading' as const,
    title: loading ? 'Өнөөдрийн хичээлийг бэлдэж байна…' : 'Япон хэлээ үргэлжлүүлэх',
    subtitle: loading ? 'Давталт, хичээл, сул чадварыг шалгаж байна' : 'Суралцах зам руу орох',
    href: '/home',
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconBubble}>
          <Ionicons
            name={iconFor(plan.kind)}
            size={30}
            color={colors.brand.primary}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>ӨНӨӨДРИЙН ХИЧЭЭЛ</Text>
          <Text style={styles.title}>{plan.title}</Text>
          <Text style={styles.subtitle}>{plan.subtitle}</Text>
        </View>
      </View>
      <Button
        label={loading ? 'Бэлдэж байна…' : 'ЭХЛЭХ'}
        size="lg"
        disabled={loading || !action}
        onPress={() => action && router.push(action.href as never)}
        leftIcon={<Ionicons name="play" size={18} color={colors.text.inverse} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorCard: { borderColor: tint(colors.warning, 0.35) },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.soft.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  kicker: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: 4,
  },
  title: {
    ...typography.heading.lg,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: 3,
  },
  retry: { marginTop: spacing.md, alignSelf: 'flex-start' },
});

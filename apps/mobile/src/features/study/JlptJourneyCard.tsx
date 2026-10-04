import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import { useLessonChapters } from '../lessons/useLessonChapters';

export function JlptJourneyCard() {
  const router = useRouter();
  const { chapters, loading, advanceGateOk } = useLessonChapters();

  const journey = useMemo(() => {
    const orderedChapters = [...chapters].sort(
      (a, b) => a.jlpt_level - b.jlpt_level || a.order_num - b.order_num,
    );
    const available = orderedChapters.filter((chapter) => !chapter.locked_below_advance_gate);
    const lessons = available.flatMap((chapter) =>
      [...(chapter.lessons ?? [])].sort((a, b) => a.order_num - b.order_num),
    );
    const completed = lessons.filter((lesson) => lesson.progress?.completed_at).length;
    const next = lessons.find((lesson) => !lesson.progress?.completed_at) ?? lessons[0] ?? null;
    const currentLevel =
      available.find((chapter) => chapter.lessons?.some((lesson) => lesson.id === next?.id))?.jlpt_level ??
      available[0]?.jlpt_level ??
      1;
    return { completed, total: lessons.length, next, currentLevel };
  }, [chapters]);

  if (loading) {
    return (
      <Card padding="lg" style={styles.card}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand.primary} />
          <Text style={styles.muted}>Суралцах замыг ачаалж байна…</Text>
        </View>
      </Card>
    );
  }

  if (!journey.next) {
    return (
      <Card padding="lg" style={styles.card}>
        <Text style={styles.title}>JLPT хичээл одоогоор алга</Text>
        <Text style={styles.muted}>Админ хэсгээс нийтлэгдсэн хичээл нэмсний дараа энд суралцах зам гарна.</Text>
      </Card>
    );
  }

  const pct = journey.total > 0 ? Math.round((journey.completed / journey.total) * 100) : 0;

  return (
    <Card padding="lg" variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="map-outline" size={22} color={colors.brand.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>ОДОО СУРАХ</Text>
          <Text style={styles.title}>JLPT N{6 - journey.currentLevel} суралцах зам</Text>
          <Text style={styles.muted}>
            {journey.completed}/{journey.total} хичээл · {pct}% дууссан
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Button
        label="Дараагийн хичээл"
        onPress={() => router.push(`/lessons/${journey.next!.id}` as never)}
        rightIcon={<Ionicons name="arrow-forward" size={17} color={colors.text.inverse} />}
      />
      {advanceGateOk === false && journey.currentLevel === 1 ? (
        <Text style={styles.gate}>N5-аа дуусгах эсвэл N5 mock шалгалтад тэнцвэл N4 нээгдэнэ.</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  copy: { flex: 1 },
  eyebrow: { ...typography.body.xs, color: colors.brand.primary, fontWeight: '800', letterSpacing: 0.7 },
  title: { ...typography.heading.md, color: colors.text.primary, marginTop: 2 },
  muted: { ...typography.body.sm, color: colors.text.secondary, marginTop: 3 },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.brand.primary, borderRadius: radius.full },
  gate: { ...typography.body.xs, color: colors.text.muted, marginTop: spacing.sm },
});

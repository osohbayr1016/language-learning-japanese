import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../primitives';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { colors, spacing, typography } from '../../theme';
import { LearnerStatusBar } from './LearnerStatusBar';
import { DailyQuestCard } from './DailyQuestCard';
import { LearningPathMap } from './LearningPathMap';
import { useLessonChapters } from '../lessons/useLessonChapters';
import { useStudyNextAction } from '../study/useStudyNextAction';
import { StudyDataStatusCard } from '../study/StudyDataStatusCard';

export default function HomeScreen() {
  const { streak, todayXp, dailyGoal, refresh } = useGamification();
  const { token } = useAuth();
  const [name, setName] = useState('Сурагч');

  const {
    chapters,
    loading: lessonsLoading,
    error: lessonsError,
    degraded,
    retry: retryLessons,
  } = useLessonChapters();

  const {
    action,
    loading: actionLoading,
    error: actionError,
    retry: retryAction,
  } = useStudyNextAction();

  useEffect(() => {
    void refresh();
    if (!token) return;
    let alive = true;
    void api.user.profile(token)
      .then((p) => {
        if (alive) setName(p.data.display_name || 'Сурагч');
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [refresh, token]);

  return (
    <Screen scroll scrollBottomInset={78} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ЯПОН ХЭЛНИЙ ЗАМ</Text>
        <Text style={styles.greeting}>Сайн уу, {name}</Text>
        <Text style={styles.heroSubtitle}>
          Өнөөдөр нэг жижиг алхам. Маргааш япон хэл арай ойр болно.
        </Text>
      </View>

      <LearnerStatusBar
        streak={streak?.current_streak ?? 0}
        todayXp={todayXp}
        goal={dailyGoal}
      />

      <DailyQuestCard
        action={action}
        loading={actionLoading}
        error={actionError}
        onRetry={retryAction}
      />

      {lessonsError ? (
        <StudyDataStatusCard
          kind={degraded ? 'warning' : 'error'}
          title={degraded ? 'Явцын мэдээлэл түр алга' : 'Суралцах замыг ачаалж чадсангүй'}
          message={
            degraded
              ? 'Хичээлийн замыг харуулж байна, гэхдээ таны хувийн явц түр баталгаажаагүй.'
              : lessonsError
          }
          onRetry={retryLessons}
        />
      ) : null}

      <View style={styles.pathHead}>
        <View>
          <Text style={styles.pathTitle}>Таны суралцах зам</Text>
          <Text style={styles.pathSubtitle}>
            Нэг хичээл дуусгаад дараагийн зангилаагаа нээнэ
          </Text>
        </View>
      </View>

      {lessonsLoading && chapters.length === 0 ? (
        <View style={styles.pathSkeleton}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonCircle} />
        </View>
      ) : (
        <LearningPathMap
          chapters={chapters}
          dataReliable={!degraded && !lessonsError}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg.primary,
  },
  hero: {
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.heading.xl,
    color: colors.text.primary,
  },
  heroSubtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    maxWidth: 430,
  },
  pathHead: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  pathTitle: {
    ...typography.heading.lg,
    color: colors.text.primary,
  },
  pathSubtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pathSkeleton: {
    minHeight: 420,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  skeletonCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.bg.elevated,
    borderWidth: 4,
    borderColor: colors.border,
  },
  skeletonLine: {
    width: 5,
    height: 52,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
});

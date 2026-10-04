import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { MetricRing } from './MetricRing';
import { LessonDoneMockExamCta } from './LessonDoneMockExamCta';
import type { SkillScores } from './skills';
import type { Streak } from '../../lib/api/user';
import type { JlptLevel, ImportedLessonContent } from '../../lib/types';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  durationSec: number;
  xpEarned: number;
  accuracy: number;
  mastered: boolean | null;
  masteryRequired: number;
  finalizing: boolean;
  finalizeError: string | null;
  onRetryFinalize: () => void;
  skills: SkillScores;
  streak: Streak;
  enablePostLessonNav: boolean;
  token: string | null;
  importedContent?: ImportedLessonContent | null;
  chapterJlptLevel?: JlptLevel;
  nextLesson: { id: number; title_mn: string } | null;
  goNext: () => void;
  onContinue: () => void;
};

export function LessonDoneWithStats({
  durationSec,
  xpEarned,
  accuracy,
  mastered,
  masteryRequired,
  finalizing,
  finalizeError,
  onRetryFinalize,
  skills,
  streak,
  enablePostLessonNav,
  token,
  importedContent,
  chapterJlptLevel,
  nextLesson,
  goNext,
  onContinue,
}: Props) {
  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Ionicons
          name={finalizeError ? 'alert-circle' : mastered === false ? 'refresh-circle' : 'trophy'}
          size={64}
          color={finalizeError ? colors.error : mastered === false ? colors.brand.primary : colors.warning}
        />
        <Text style={styles.title}>
          {finalizing
            ? 'Дүнг хадгалж байна…'
            : finalizeError
              ? 'Дүнг хадгалж чадсангүй'
              : mastered === false
                ? 'Энэ оролдлого хараахан эзэмшсэнд тооцогдохгүй'
                : 'Хичээл эзэмшлээ!'}
        </Text>
        <Text style={styles.sub}>
          {mastered === false
            ? `${Math.round(masteryRequired * 100)}% шаардлагатай · Одоогоор ${Math.round(accuracy * 100)}%`
            : `+${xpEarned} XP цуглуулсан`}
        </Text>
        {finalizeError ? <Text style={styles.error}>{finalizeError}</Text> : null}
      </View>

      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: '#FFF6D8' }]}>
          <Ionicons name="time-outline" size={18} color={colors.warning} />
          <Text style={styles.pillLabel}>{formatDuration(durationSec)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#E2F4FF' }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.brand.secondary} />
          <Text style={styles.pillLabel}>{Math.round(accuracy * 100)}% нарийвчлал</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#FFE7E7' }]}>
          <Ionicons name="flame" size={18} color={colors.error} />
          <Text style={styles.pillLabel}>{streak?.current_streak ?? 0} өдөр</Text>
        </View>
      </View>

      <Text style={styles.section}>Чадварын явц</Text>
      <View style={styles.grid}>
        <MetricRing label="Сонсох" value={skills.listening} icon="ear" color={colors.brand.secondary} />
        <MetricRing label="Дуудлага" value={skills.pronunciation} icon="mic" color={colors.error} />
        <MetricRing label="Аялга" value={skills.pitch} icon="musical-notes" color={colors.warning} />
        <MetricRing label="Цээж" value={skills.recall} icon="bulb" color={colors.brand.primary} />
        <MetricRing label="Унших" value={skills.reading} icon="book" color={colors.accent.purple} />
        <MetricRing label="Зураас" value={skills.stroke} icon="brush" color={colors.accent.pink} />
      </View>

      <View style={styles.btns}>
        {finalizeError ? <Button label="Дүн хадгалахыг дахин оролдох" onPress={onRetryFinalize} /> : null}
        {enablePostLessonNav && mastered === true ? (
          <LessonDoneMockExamCta
            token={token}
            imported={importedContent}
            chapterJlptLevel={chapterJlptLevel}
          />
        ) : null}
        {enablePostLessonNav && mastered === true && nextLesson ? (
          <Button
            label={`${mn.lesson.continueNextPrefix} ${nextLesson.title_mn}`}
            onPress={goNext}
            accessibilityLabel={`${mn.lesson.continueNextPrefix} ${nextLesson.title_mn}`}
          />
        ) : null}
        <Button
          label={
            enablePostLessonNav
              ? mastered === false
                ? 'Суралцах хэсэг рүү буцах'
                : (nextLesson ? mn.lesson.backToStudy : 'ҮРГЭЛЖЛҮҮЛЭХ')
              : mn.admin.lessonPreviewDone
          }
          variant={enablePostLessonNav && nextLesson ? 'secondary' : 'primary'}
          onPress={onContinue}
          disabled={finalizing}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  title: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.sm },
  sub: { ...typography.heading.md, color: colors.brand.primary, marginTop: 4, textAlign: 'center' },
  error: { ...typography.body.md, color: colors.error, marginTop: spacing.sm, textAlign: 'center' },
  pillRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  pillLabel: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  section: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  btns: { marginTop: spacing.xl, gap: spacing.md },
});

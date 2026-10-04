import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { LessonDoneMockExamCta } from './LessonDoneMockExamCta';
import type { HskLevel, ImportedLessonContent } from '../../lib/types';

type Props = {
  enablePostLessonNav: boolean;
  nextLesson: { id: number; title_mn: string } | null;
  goNext: () => void;
  onContinue: () => void;
  importedContent?: ImportedLessonContent | null;
  chapterHskLevel?: HskLevel;
  mastered: boolean | null;
  masteryRequired: number;
  finalizing: boolean;
  finalizeError: string | null;
  onRetryFinalize: () => void;
};

export function LessonDoneMinimal({
  enablePostLessonNav,
  nextLesson,
  goNext,
  onContinue,
  importedContent,
  chapterHskLevel,
  mastered,
  masteryRequired,
  finalizing,
  finalizeError,
  onRetryFinalize,
}: Props) {
  const { token } = useAuth();

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
                ? `${Math.round(masteryRequired * 100)}% хүргээд дахин оролдоорой`
                : 'Хичээл эзэмшлээ!'}
        </Text>
        {finalizeError ? <Text style={styles.error}>{finalizeError}</Text> : null}
      </View>

      <View style={styles.btns}>
        {finalizeError ? <Button label="Дүн хадгалахыг дахин оролдох" onPress={onRetryFinalize} /> : null}
        {enablePostLessonNav && mastered === true ? (
          <LessonDoneMockExamCta
            token={token}
            imported={importedContent}
            chapterHskLevel={chapterHskLevel}
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
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  title: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.sm },
  btns: { marginTop: spacing.xl, gap: spacing.md },
  error: { ...typography.body.md, color: colors.error, marginTop: spacing.sm, textAlign: 'center' },
});

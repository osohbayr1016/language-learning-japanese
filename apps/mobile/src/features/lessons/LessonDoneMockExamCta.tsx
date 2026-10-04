import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../primitives';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';
import type { JlptLevel, ImportedLessonContent } from '../../lib/types';
import { useLessonDoneMockExam } from './useLessonDoneMockExam';

type Props = {
  token: string | null | undefined;
  imported: ImportedLessonContent | null | undefined;
  chapterJlptLevel: JlptLevel | undefined;
};

export function LessonDoneMockExamCta({ token, imported, chapterJlptLevel }: Props) {
  const router = useRouter();
  const mock = useLessonDoneMockExam(token, imported, chapterJlptLevel);

  if (mock.loading || mock.templateId == null) return null;

  return (
    <View style={styles.wrap}>
      <Button
        label={mn.lesson.doneMockExam}
        variant="secondary"
        onPress={() => router.push(`/study/mock-exam?templateId=${mock.templateId}` as never)}
        accessibilityLabel={mn.lesson.doneMockExam}
      />
      {mock.usedJlptMaxIdFallback ? (
        <Text style={styles.hint} accessibilityRole="text">
          {mn.lesson.doneMockExamJlptFallbackHint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  hint: { ...typography.body.sm, color: colors.text.secondary },
});

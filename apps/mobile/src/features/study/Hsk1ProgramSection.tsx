import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { mn } from '../../i18n/mn';
import { Hsk1LessonList } from '../lessons/Hsk1LessonList';
import { useLessonChapters } from '../lessons/useLessonChapters';
import { colors, spacing, typography } from '../../theme';
import { Hsk1AdvanceGateBanner } from './Hsk1AdvanceGateBanner';

/** Хичээлийн жагсаалт (нүүр дээр эхний түвшнүүд). */
const MAX_HOME_HSK = 3;

type Props = {
  /** Set when the caller already renders a heading for this block. */
  hideTitle?: boolean;
};

export function Hsk1ProgramSection({ hideTitle = false }: Props) {
  const { chapters, loading, advanceGateOk } = useLessonChapters();
  const homeChapters = useMemo(
    () => chapters.filter((c) => c.jlpt_level <= MAX_HOME_HSK),
    [chapters],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View>
      {advanceGateOk ? <Hsk1AdvanceGateBanner /> : null}
      {hideTitle ? null : <Text style={styles.listTitle}>{mn.study.hsk1LessonsTitle}</Text>}
      <Hsk1LessonList chapters={homeChapters} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  listTitle: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});

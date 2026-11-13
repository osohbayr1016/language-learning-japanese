import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JapaneseText, RomajiRow } from '../../../components/japanese';
import { Card } from '../../../primitives';
import { colors, spacing, typography } from '../../../theme';
import { mn } from '../../../i18n/mn';
import type { WordWithProgress } from '../../../lib/types';

type Props = {
  word: WordWithProgress;
  isCorrect: boolean;
};

export function RevealCard({ word, isCorrect }: Props) {
  return (
    <Card
      padding="lg"
      style={[styles.card, isCorrect ? styles.correct : styles.wrong]}
    >
      <View style={styles.head}>
        <Ionicons
          name={isCorrect ? 'checkmark-circle' : 'close-circle'}
          size={26}
          color={isCorrect ? colors.success : colors.error}
        />
        <Text style={[styles.headText, { color: isCorrect ? colors.success : colors.error }]}>
          {isCorrect ? mn.study.correct : mn.study.wrong}
        </Text>
      </View>
      <JapaneseText text={word.kanji} size="md" />
      <RomajiRow romaji={word.romaji} size="md" />
      <Text style={styles.meaning}>{word.meaning_mn}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, alignItems: 'center', gap: spacing.xs },
  correct: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  wrong: { borderColor: colors.error, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  headText: { ...typography.heading.md },
  meaning: { ...typography.body.lg, color: colors.text.secondary, marginTop: 4 },
});

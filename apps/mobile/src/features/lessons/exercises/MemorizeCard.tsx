import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../primitives';
import { JapaneseText, RomajiRow } from '../../../components/japanese';
import { PronounceButton } from '../../../components/audio/PronounceButton';
import { colors, spacing, typography } from '../../../theme';
import type { Exercise } from '../types';

type Props = {
  exercise: Extract<Exercise, { kind: 'memorize' }>;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
};

export function MemorizeCard({ exercise, disabled, onAnswer }: Props) {
  const w = exercise.word;
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <JapaneseText text={w.kanji} size="lg" />
        <RomajiRow romaji={w.romaji ?? ''} size="lg" />
        <Text style={styles.meaning}>{w.meaning_mn}</Text>
        <PronounceButton wordId={w.id} meaningMn={w.meaning_mn} size="lg" style={{ marginTop: spacing.lg }} showHints />
      </View>
      <Button
        label="Цээжиллээ"
        onPress={() => onAnswer(true)}
        disabled={disabled}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meaning: {
    ...typography.heading.lg,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

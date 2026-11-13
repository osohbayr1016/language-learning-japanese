import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../primitives';
import { JapaneseText } from '../../../components/japanese';
import { colors, radius, spacing, typography } from '../../../theme';
import type { Exercise } from '../types';

type Props = {
  exercise: Extract<Exercise, { kind: 'true-false' }>;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
};

export function TrueFalse({ exercise, disabled, onAnswer }: Props) {
  const [pick, setPick] = useState<boolean | null>(null);

  const handle = (val: boolean) => {
    if (pick !== null || disabled) return;
    setPick(val);
    onAnswer(val === exercise.isTrue);
  };

  return (
    <View style={styles.root}>
      <View style={styles.statement}>
        <JapaneseText text={exercise.word.kanji} size="md" />
        <Text style={styles.equals}>=</Text>
        <Text style={styles.meaning}>{exercise.shownMeaning}</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.col}>
          <Button label="ҮНЭН" onPress={() => handle(true)} disabled={pick !== null || disabled} />
        </View>
        <View style={styles.col}>
          <Button
            label="ХУДАЛ"
            variant="danger"
            onPress={() => handle(false)}
            disabled={pick !== null || disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  statement: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  equals: { ...typography.heading.lg, color: colors.text.muted, marginVertical: spacing.sm },
  meaning: {
    ...typography.heading.md,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1 },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { JapaneseText } from '../../../components/japanese';
import { colors, radius, spacing } from '../../../theme';
import type { Word } from '../../../lib/types';

type State = 'idle' | 'correct' | 'wrong';

type Props = {
  candidates: Word[];
  selectedId: number | null;
  state: State;
  onPick: (w: Word) => void;
};

export function CandidateTray({ candidates, selectedId, state, onPick }: Props) {
  return (
    <View style={styles.row}>
      {candidates.map((c) => {
        const isPicked = c.id === selectedId;
        const stateStyle =
          isPicked && state === 'correct'
            ? styles.correct
            : isPicked && state === 'wrong'
              ? styles.wrong
              : styles.idle;
        return (
          <Pressable
            key={c.id}
            onPress={() => onPick(c)}
            disabled={state !== 'idle'}
            style={[styles.tile, stateStyle]}
          >
            <JapaneseText text={c.kanji} size="sm" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tile: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  idle: { backgroundColor: colors.bg.card, borderColor: colors.border },
  correct: { backgroundColor: 'rgba(16, 185, 129, 0.16)', borderColor: colors.success },
  wrong: { backgroundColor: 'rgba(239, 68, 68, 0.16)', borderColor: colors.error },
});

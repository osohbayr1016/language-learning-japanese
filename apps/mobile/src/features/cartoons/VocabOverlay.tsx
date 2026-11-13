import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { JapaneseText } from '../../components/japanese';
import { colors, radius, spacing } from '../../theme';
import type { CartoonWord } from '../../lib/api/cartoons';

type Props = {
  vocab: CartoonWord[];
  currentTime: number;
  onPick: (w: CartoonWord) => void;
};

const LOOKAHEAD = 0.4;

export function VocabOverlay({ vocab, currentTime, onPick }: Props) {
  const active = useMemo(
    () => vocab.filter((v) => currentTime + LOOKAHEAD >= v.start_s && currentTime <= v.end_s + LOOKAHEAD),
    [vocab, currentTime]
  );

  if (active.length === 0) return null;

  return (
    <View style={styles.row} pointerEvents="box-none">
      {active.map((v) => (
        <Pressable key={`${v.id}-${v.start_s}`} onPress={() => onPick(v)} style={styles.chip}>
          <JapaneseText text={v.kanji} size="sm" align="left" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent.purple,
  },
});

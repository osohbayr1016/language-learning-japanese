import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { JapaneseText } from '../../components/japanese';
import { colors, radius, spacing, typography } from '../../theme';
import type { WordWithProgress } from '../../lib/types';

type Props = {
  words: WordWithProgress[];
  current: WordWithProgress;
  onPick: (w: WordWithProgress) => void;
};

export function CharacterPicker({ words, current, onPick }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {words.map((w) => {
        const active = w.id === current.id;
        const firstChar = Array.from(w.kanji)[0];
        return (
          <Pressable
            key={w.id}
            onPress={() => onPick(w)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <JapaneseText text={firstChar} size="sm" />
            <Text style={styles.label} numberOfLines={1}>{w.meaning_mn}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 72,
  },
  activeChip: { borderColor: colors.accent.purple },
  label: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
});

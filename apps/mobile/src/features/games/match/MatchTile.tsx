import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { JapaneseText } from '../../../components/japanese';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import type { MatchCard } from './cards';
import type { Word } from '../../../lib/types';

type State = 'idle' | 'selected' | 'matched' | 'wrong';

type Props = {
  card: MatchCard;
  state: State;
  onPress: () => void;
};

export function MatchTile({ card, state, onPress }: Props) {
  const styleByState = {
    idle: styles.idle,
    selected: styles.selected,
    matched: styles.matched,
    wrong: styles.wrong,
  } as const;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={state === 'matched' || state === 'wrong'}
      onPress={onPress}
      style={[styles.tile, styleByState[state]]}
    >
      {card.type === 'kanji' ? (
        <JapaneseText text={card.text} size="sm" />
      ) : (
        <Text style={styles.text}>{card.text}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 80,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: { backgroundColor: colors.bg.card, borderColor: colors.border, ...shadows.sm },
  selected: { backgroundColor: colors.bg.elevated, borderColor: colors.accent.purple },
  matched: { backgroundColor: 'rgba(16, 185, 129, 0.16)', borderColor: colors.success, opacity: 0.7 },
  wrong: { backgroundColor: 'rgba(239, 68, 68, 0.16)', borderColor: colors.error },
  text: { ...typography.heading.sm, color: colors.text.primary, textAlign: 'center' },
});

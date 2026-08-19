import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToneColoredText } from '../../../components/hanzi';
import { Touchable } from '../../../primitives';
import { colors, motion, radius, spacing, tint, typography } from '../../../theme';
import type { WordWithProgress } from '../../../lib/types';

type State = 'idle' | 'correct' | 'wrong' | 'reveal';

type Props = {
  word: WordWithProgress;
  show: 'jp' | 'mn';
  state: State;
  onPress: () => void;
};

export function AnswerOption({ word, show, state, onPress }: Props) {
  const stateStyles: Record<State, object> = {
    idle: styles.idle,
    correct: styles.correct,
    wrong: styles.wrong,
    reveal: styles.reveal,
  };

  const label = show === 'jp' ? word.kanji : word.meaning_mn;
  const locked = state !== 'idle';

  return (
    <Touchable
      accessibilityLabel={label}
      accessibilityState={{ disabled: locked }}
      onPress={onPress}
      disabled={locked}
      // This is the single most-tapped control in the app and previously had no
      // press state at all — taps registered with zero visible acknowledgement.
      haptic={state === 'idle' ? 'light' : 'none'}
      scaleTo={motion.scale.press}
      hoverLift={locked ? 0 : 2}
      hoverShadow={!locked}
      style={[styles.btn, stateStyles[state]]}
      hoveredStyle={!locked ? styles.hovered : undefined}
      pressedStyle={!locked ? styles.pressed : undefined}
    >
      <View style={styles.row}>
        <View style={styles.body}>
          {show === 'jp' ? (
            <ToneColoredText hanzi={word.kanji} size="sm" align="left" />
          ) : (
            <Text style={styles.text}>{word.meaning_mn}</Text>
          )}
        </View>
        {/* A shape as well as a colour, so right/wrong doesn't rely on hue alone. */}
        {state === 'correct' || state === 'reveal' ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        ) : null}
        {state === 'wrong' ? (
          <Ionicons name="close-circle" size={22} color={colors.error} />
        ) : null}
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  body: { flex: 1 },
  hovered: { borderColor: colors.brand.primary, backgroundColor: colors.soft.brand },
  pressed: { borderBottomWidth: 2, marginBottom: spacing.sm + 2 },
  idle: { backgroundColor: colors.bg.card, borderColor: colors.borderStrong },
  correct: { backgroundColor: tint(colors.success, 0.14), borderColor: colors.success },
  wrong: { backgroundColor: tint(colors.error, 0.12), borderColor: colors.error },
  reveal: { backgroundColor: tint(colors.success, 0.08), borderColor: colors.success },
  text: { ...typography.heading.sm, color: colors.text.primary },
});

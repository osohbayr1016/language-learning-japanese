import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Touchable } from '../../../primitives';
import { colors, motion, radius, spacing, tint, typography } from '../../../theme';

type State = 'idle' | 'selected' | 'correct' | 'wrong';

type Props = {
  label: string;
  sub?: string;
  state: State;
  onPress: () => void;
  disabled?: boolean;
};

/** Tints derive from the palette, so answer feedback matches the rest of the app. */
const COLORS: Record<State, { bg: string; border: string; text: string }> = {
  idle: { bg: colors.bg.card, border: colors.borderStrong, text: colors.text.primary },
  selected: {
    bg: tint(colors.info, 0.1),
    border: colors.info,
    text: colors.info,
  },
  correct: {
    bg: tint(colors.success, 0.12),
    border: colors.success,
    text: colors.success,
  },
  wrong: { bg: tint(colors.error, 0.1), border: colors.error, text: colors.error },
};

export function OptionTile({ label, sub, state, onPress, disabled }: Props) {
  const c = COLORS[state];
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={sub}
      accessibilityState={{ selected: state === 'selected' }}
      haptic={state === 'idle' ? 'light' : 'none'}
      scaleTo={motion.scale.press}
      hoverLift={2}
      style={[styles.tile, { backgroundColor: c.bg, borderColor: c.border }]}
      hoveredStyle={state === 'idle' ? { backgroundColor: colors.bg.washi } : undefined}
      pressedStyle={styles.pressed}
    >
      <Text style={[styles.label, { color: c.text }]} numberOfLines={2}>
        {label}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 64,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  pressed: { borderBottomWidth: 2, marginBottom: 2 },
  label: { ...typography.heading.md },
  sub: { ...typography.body.sm, color: colors.text.muted, marginTop: 2 },
});

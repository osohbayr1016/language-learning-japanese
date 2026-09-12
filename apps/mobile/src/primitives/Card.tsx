import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, motion, radius, shadows, spacing } from '../theme';
import { Touchable } from './Touchable';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: keyof typeof spacing | 0;
  glow?: string;
  /** Tints the left edge — use to colour-code a card to its section. */
  accent?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Card({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
  glow,
  accent,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const padValue = typeof padding === 'number' ? padding : spacing[padding];

  const variants: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
    },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  };

  const composed: ViewStyle = {
    borderRadius: radius.lg,
    padding: padValue,
    ...variants[variant],
    ...(accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null),
    ...(glow ? shadows.glow(glow) : {}),
  };

  if (onPress) {
    return (
      <Touchable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        scaleTo={motion.scale.pressLg}
        hoverLift={3}
        style={[composed, style]}
        hoveredStyle={{ borderColor: accent ?? colors.borderStrong }}
      >
        {children}
      </Touchable>
    );
  }

  return <View style={[composed, style]}>{children}</View>;
}

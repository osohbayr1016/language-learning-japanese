import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, motion, radius, spacing, tint, typography } from '../theme';
import { Touchable } from './Touchable';

type Props = {
  label: string;
  color?: string;
  filled?: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
  /** Renders the pressed/selected state — use for filter chips. */
  selected?: boolean;
  leftIcon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Pill({
  label,
  color = colors.accent.purple,
  filled = false,
  size = 'sm',
  onPress,
  selected,
  leftIcon,
  accessibilityLabel,
  style,
}: Props) {
  const isFilled = filled || selected === true;
  const padV = size === 'sm' ? 4 : 8;
  const padH = size === 'sm' ? spacing.sm : spacing.md;

  const composed: ViewStyle = {
    paddingHorizontal: padH,
    paddingVertical: padV,
    borderRadius: radius.full,
    // Tint at 12% keeps the label readable; the old `${color}22` sat under
    // dark text and produced muddy, near-illegible chips.
    backgroundColor: isFilled ? color : tint(color, 0.12),
    borderWidth: 1,
    borderColor: isFilled ? color : tint(color, 0.45),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  };

  const labelStyle = {
    ...typography.body.sm,
    // Filled pills use every accent at >= 4.5:1, so white always reads.
    color: isFilled ? colors.text.inverse : color,
    fontWeight: '700' as const,
  };

  const Inner = (
    <View style={composed}>
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Touchable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={selected === undefined ? undefined : { selected }}
        scaleTo={motion.scale.pressSm}
        hoverLift={1}
        hoverShadow={false}
        style={style}
      >
        {Inner}
      </Touchable>
    );
  }

  return <View style={style}>{Inner}</View>;
}

const styles = StyleSheet.create({
  icon: { marginRight: 4 },
});

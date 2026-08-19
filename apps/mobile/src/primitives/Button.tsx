import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, interaction, radius, shadows, spacing, typography } from '../theme';
import { fireHaptic, type HapticStrength } from './Touchable';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  /** Defaults to `label`; use for clearer screen-reader phrasing when needed. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: HapticStrength;
  style?: ViewStyle;
  testID?: string;
};

/** Solid variants sit on a darker plinth that collapses when pressed. */
const LIFT = 4;

type VariantSpec = {
  bg: string;
  plinth?: string;
  hoverBg?: string;
  border?: string;
  text: string;
  spinner: string;
};

export function Button({
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  haptic = 'medium',
  style,
  testID,
}: Props) {
  const inert = disabled || loading;

  const heights: Record<Size, number> = { sm: 40, md: 50, lg: 58 };
  const padH: Record<Size, number> = { sm: spacing.md, md: spacing.lg, lg: spacing.lg };
  const textSize: Record<Size, TextStyle> = {
    sm: typography.body.md,
    md: typography.heading.sm,
    lg: typography.heading.md,
  };

  const specs: Record<Variant, VariantSpec> = {
    primary: {
      bg: colors.brand.primary,
      plinth: colors.brand.primaryDark,
      hoverBg: colors.brand.primaryHover,
      text: colors.text.inverse,
      spinner: colors.text.inverse,
    },
    success: {
      bg: colors.success,
      plinth: '#13603A',
      hoverBg: '#219A5E',
      text: colors.text.inverse,
      spinner: colors.text.inverse,
    },
    danger: {
      bg: colors.error,
      plinth: '#A82C2C',
      hoverBg: '#E24C4C',
      text: colors.text.inverse,
      spinner: colors.text.inverse,
    },
    secondary: {
      bg: colors.bg.primary,
      border: colors.borderStrong,
      hoverBg: colors.bg.washi,
      text: colors.text.primary,
      spinner: colors.brand.primary,
    },
    ghost: {
      bg: 'transparent',
      hoverBg: colors.soft.brand,
      text: colors.brand.primary,
      spinner: colors.brand.primary,
    },
  };

  const spec = specs[variant];
  const solid = Boolean(spec.plinth);

  const base: ViewStyle = {
    height: heights[size],
    borderRadius: radius.full,
    paddingHorizontal: padH[size],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: fullWidth ? '100%' : undefined,
    backgroundColor: spec.bg,
    ...(spec.border ? { borderWidth: 2, borderColor: spec.border } : null),
    // The plinth is the button's "thickness" — pressing collapses it, so the
    // control physically sinks instead of just fading out.
    ...(solid ? { borderBottomWidth: LIFT, borderBottomColor: spec.plinth } : null),
    ...(solid && !inert ? shadows.sm : null),
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy: loading }}
      onPress={onPress}
      onPressIn={() => {
        if (!inert) fireHaptic(haptic);
      }}
      disabled={inert}
      style={({ pressed, hovered, focused }) => {
        const isHovered = Boolean(hovered) && !inert && !pressed;
        const isPressed = pressed && !inert;
        return [
          interaction.web,
          base,
          inert ? styles.inert : null,
          isHovered && spec.hoverBg ? { backgroundColor: spec.hoverBg } : null,
          isHovered && solid ? shadows.md : null,
          // Sink: lose the plinth, translate down by exactly what was lost, so
          // the top edge moves and the footprint stays put.
          isPressed && solid
            ? { borderBottomWidth: 0, marginBottom: LIFT, transform: [{ translateY: LIFT }] }
            : null,
          isPressed && !solid ? { transform: [{ scale: 0.97 }] } : null,
          focused ? interaction.focusRing : null,
          style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={spec.spinner} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
          <Text style={[textSize[size], { color: spec.text }, styles.label]} numberOfLines={1}>
            {label}
          </Text>
          {rightIcon ? <View style={styles.right}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  left: { marginRight: spacing.sm },
  right: { marginLeft: spacing.sm },
  label: {
    letterSpacing: 0.2,
    fontWeight: '800',
    ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : null),
  },
  /** 0.5 opacity made disabled labels unreadable; 0.45 on the fill keeps text legible. */
  inert: { opacity: 0.55 },
});

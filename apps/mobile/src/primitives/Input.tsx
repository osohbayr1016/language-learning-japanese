import React, { forwardRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, motion, radius, spacing, tint, typography } from '../theme';

type Props = TextInputProps & {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  /** Shown under the field when there's no error — use for format hints. */
  hint?: string;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    leftIcon,
    rightIcon,
    error,
    hint,
    containerStyle,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          focused && !invalid ? styles.focused : null,
          invalid ? styles.errored : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.text.faint}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '700',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.input,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    height: 56,
    ...(Platform.OS === 'web'
      ? {
          transitionProperty: 'border-color, box-shadow',
          transitionDuration: `${motion.duration.fast}ms`,
          transitionTimingFunction: motion.easing.standard,
        }
      : null),
  },
  /** A colour change alone is a weak focus cue; the halo makes it unmissable. */
  focused: {
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: tint(colors.brand.primary, 0.03),
  },
  errored: { borderColor: colors.error, backgroundColor: tint(colors.error, 0.04) },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    height: '100%',
    // No `outlineStyle: none` here on purpose: the box halo below is a *focus*
    // cue for everyone, but keyboard users still need the global :focus-visible
    // ring, and killing the outline inline would suppress it.
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  error: { ...typography.body.sm, color: colors.error, marginTop: 4, fontWeight: '600' },
  hint: { ...typography.body.sm, color: colors.text.muted, marginTop: 4 },
});

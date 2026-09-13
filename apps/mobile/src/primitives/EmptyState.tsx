import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon?: IconName;
  /** Tints the icon and its soft circle. Defaults to the brand plum. */
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
  title: string;
  /** One plain sentence: what this means and what to do next. */
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: ViewStyle;
};

const TONES = {
  brand: { fg: colors.brand.primary, bg: colors.soft.brand },
  neutral: { fg: colors.text.muted, bg: colors.bg.elevated },
  success: { fg: colors.success, bg: colors.soft.green },
  warning: { fg: colors.warning, bg: colors.soft.amber },
} as const;

/**
 * The one way an empty, failed or not-yet-available screen looks.
 *
 * Screens used to print a bare sentence on a white page ("Хичээлийн жагсаалт
 * хоосон…") with no way forward. Every empty state now has an icon, a title,
 * one line of explanation and at least one thing to tap.
 */
export function EmptyState({
  icon = 'file-tray-outline',
  tone = 'brand',
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: Props) {
  const t = TONES[tone];
  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={30} color={t.fg} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" fullWidth={false} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.heading.md, color: colors.text.primary, textAlign: 'center' },
  body: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { marginTop: spacing.md, alignItems: 'center', gap: spacing.xs },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { Touchable } from './Touchable';

type Props = {
  title: string;
  /** One line explaining what this group is for — the main workflow cue. */
  subtitle?: string;
  /** Renders a numbered chip, so a sequence of sections reads as steps 1-2-3. */
  step?: number;
  /** Optional trailing link, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * One section header used across every hub screen. Screens previously each
 * styled their own headings, so the same level of hierarchy looked different
 * from tab to tab and the reading order was hard to follow.
 */
export function SectionHeading({ title, subtitle, step, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {step !== undefined ? (
          <View style={styles.step}>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ) : null}
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Touchable
            onPress={onAction}
            accessibilityLabel={actionLabel}
            hoverLift={0}
            hoverShadow={false}
            haptic="light"
            style={styles.action}
            hoveredStyle={styles.actionHovered}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.brand.primary} />
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1 },
  step: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.soft.brand,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { ...typography.body.sm, fontWeight: '800', color: colors.brand.primary },
  title: { ...typography.heading.md, color: colors.text.primary },
  subtitle: { ...typography.body.sm, color: colors.text.muted, marginTop: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  actionHovered: { backgroundColor: colors.soft.brand },
  actionText: { ...typography.body.sm, fontWeight: '700', color: colors.brand.primary },
});

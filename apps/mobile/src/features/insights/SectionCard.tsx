import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Props = {
  title: string;
  right?: React.ReactNode;
  /** Put `right` on its own row under the title (for wide controls like range tabs). */
  stackRight?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SectionCard({ title, right, stackRight = false, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.head, stackRight && styles.headStacked]}>
        <Text style={[styles.title, stackRight && styles.titleStacked]} numberOfLines={2}>
          {title}
        </Text>
        {right ?? null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.heading.md, color: colors.text.primary, flexShrink: 1 },
  titleStacked: { flexShrink: 0 },
});

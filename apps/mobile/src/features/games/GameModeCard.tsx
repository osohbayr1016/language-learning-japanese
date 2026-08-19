import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Touchable } from '../../primitives';
import { colors, radius, shadows, spacing, tint, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  best: number;
  onPress: () => void;
};

export function GameModeCard({ title, subtitle, icon, color, best, onPress }: Props) {
  const hasBest = best > 0;

  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityHint={
        hasBest ? `${subtitle}. ${mn.games.bestScore}: ${best}` : subtitle
      }
      hoverLift={4}
      style={[styles.card, { borderTopColor: color }]}
      hoveredStyle={{ backgroundColor: tint(color, 0.05) }}
    >
      {/* Every accent is >= 4.5:1 on white, so a white glyph on the solid fill
          reads properly — the old light-peach fill made this icon invisible. */}
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={26} color="#FFFFFF" />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      <View style={styles.footer}>
        {hasBest ? (
          <View style={[styles.badge, { backgroundColor: tint(color, 0.12) }]}>
            <Ionicons name="trophy" size={12} color={color} />
            <Text style={[styles.badgeLabel, { color }]}>{best}</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeNew]}>
            <Text style={styles.badgeNewLabel}>{mn.games.newBadge.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 5,
    padding: spacing.md,
    minHeight: 180,
    ...shadows.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.heading.md, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body.sm, color: colors.text.secondary },
  footer: { flexDirection: 'row', marginTop: 'auto', paddingTop: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeLabel: { fontSize: 12, fontWeight: '800' },
  badgeNew: { backgroundColor: colors.soft.brand },
  badgeNewLabel: {
    ...typography.body.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.brand.primary,
  },
});

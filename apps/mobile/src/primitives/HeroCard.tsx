import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, motion, radius, shadows, spacing, typography } from '../theme';
import { Touchable } from './Touchable';

type Props = {
  /** Small all-caps line above the title, e.g. "RECOMMENDED". */
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Fill colour. Must be >= 4.5:1 against white — every accent token is. */
  color?: string;
  /** Darker tone for the plinth under the card. */
  shadeColor?: string;
  onPress: () => void;
};

/**
 * The single "here's your next step" card. Study and Games each had their own
 * copy of this layout with slightly different spacing and press behaviour;
 * one component keeps the primary call-to-action identical across the app.
 */
export function HeroCard({
  kicker,
  title,
  subtitle,
  ctaLabel,
  icon,
  color = colors.brand.primary,
  shadeColor,
  onPress,
}: Props) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={`${kicker}: ${title}. ${subtitle}`}
      accessibilityHint={ctaLabel}
      haptic="medium"
      scaleTo={motion.scale.pressLg}
      hoverLift={3}
      style={[
        styles.card,
        { backgroundColor: color, borderBottomColor: shadeColor ?? colors.brand.primaryDark },
      ]}
      pressedStyle={styles.pressed}
    >
      <View style={styles.left}>
        <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.cta}>
          <Text style={[styles.ctaLabel, { color }]}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={color} />
        </View>
      </View>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={44} color="#FFFFFF" />
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 4,
    ...shadows.md,
  },
  /** Same sink as Button: lose the plinth, drop by exactly that much. */
  pressed: { borderBottomWidth: 0, marginBottom: spacing.lg + 4 },
  left: { flex: 1 },
  kicker: {
    ...typography.overline,
    color: '#FFFFFF',
    opacity: 0.88,
    marginBottom: 4,
  },
  title: { ...typography.heading.lg, color: '#FFFFFF' },
  subtitle: { ...typography.body.md, color: '#FFFFFF', opacity: 0.92, marginTop: 2 },
  cta: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  ctaLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});

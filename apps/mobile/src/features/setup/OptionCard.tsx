import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Touchable } from '../../primitives';
import { colors, motion, radius, spacing, typography } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
};

export function OptionCard({ title, subtitle, selected, onPress, icon }: Props) {
  return (
    <Touchable
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ selected }}
      onPress={onPress}
      haptic="light"
      scaleTo={motion.scale.press}
      hoverLift={2}
      style={[styles.card, selected && styles.selected]}
      hoveredStyle={!selected ? styles.hovered : undefined}
      pressedStyle={styles.pressed}
    >
      {icon ? (
        <View style={[styles.iconWrap, selected && styles.iconSelected]}>{icon}</View>
      ) : (
        <View style={[styles.bullet, selected && styles.bulletSelected]}>
          <Ionicons
            name={selected ? 'checkmark' : 'ellipse-outline'}
            size={selected ? 18 : 14}
            color={selected ? colors.text.inverse : colors.text.muted}
          />
        </View>
      )}

      <View style={styles.body}>
        <Text style={[styles.title, selected && styles.selectedText]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, selected && styles.selectedSub]}>{subtitle}</Text>
        ) : null}
      </View>

      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={24}
        color={selected ? colors.brand.primary : colors.text.faint}
      />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderBottomColor: colors.borderStrong,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  selected: {
    borderColor: colors.brand.primary,
    borderBottomColor: colors.brand.primaryDark,
    backgroundColor: colors.soft.brand,
  },
  hovered: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.bg.washi,
  },
  pressed: {
    borderBottomWidth: 2,
    transform: [{ translateY: 3 }],
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: colors.bg.card,
  },
  bullet: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletSelected: {
    backgroundColor: colors.brand.primary,
  },
  body: { flex: 1 },
  title: {
    ...typography.heading.md,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.muted,
    marginTop: 2,
  },
  selectedText: { color: colors.brand.primaryDark },
  selectedSub: { color: colors.text.secondary },
});

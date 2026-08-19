import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Touchable } from '../../primitives';
import { colors, motion, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import type { ReviewRating } from '@japanese-learning/srs';

type Props = {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
};

const OPTIONS: {
  rating: ReviewRating;
  label: string;
  color: string;
  shade: string;
  hint: string;
}[] = [
  { rating: 1, label: mn.study.again, color: colors.error, shade: '#A82C2C', hint: 'Санахгүй байна' },
  { rating: 3, label: mn.study.hard, color: colors.warning, shade: '#7A4300', hint: 'Хэцүү байсан' },
  { rating: 4, label: mn.study.good, color: colors.success, shade: '#13603A', hint: 'Санаж чадсан' },
  { rating: 5, label: mn.study.easy, color: colors.accent.teal, shade: '#075F71', hint: 'Амархан байсан' },
];

const LIFT = 3;

export function RatingBar({ onRate, disabled }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((o) => (
        <Touchable
          key={o.rating}
          disabled={disabled}
          onPress={() => onRate(o.rating)}
          accessibilityLabel={o.label}
          accessibilityHint={o.hint}
          haptic="medium"
          scaleTo={motion.scale.press}
          hoverLift={2}
          style={[styles.btn, { backgroundColor: o.color, borderBottomColor: o.shade }]}
          pressedStyle={styles.pressed}
        >
          {/* White, not `text.primary`: every rating colour is a saturated fill,
              and dark ink on them fell well below AA. */}
          <Text style={styles.label} numberOfLines={1}>
            {o.label}
          </Text>
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: LIFT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pressed: { borderBottomWidth: 0, marginBottom: LIFT },
  label: { ...typography.heading.sm, color: colors.text.inverse },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../primitives';
import { colors, spacing, tint, typography } from '../../theme';

type Props = {
  visible: boolean;
  correct: boolean;
  message?: string;
  correctAnswer?: string;
  onContinue: () => void;
};

export function FeedbackBanner({
  visible,
  correct,
  message,
  correctAnswer,
  onContinue,
}: Props) {
  if (!visible) return null;

  const accent = correct ? colors.success : colors.error;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.bar,
        {
          backgroundColor: tint(accent, 0.09),
          borderTopColor: tint(accent, 0.35),
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons
            name={correct ? 'checkmark' : 'close'}
            size={24}
            color={accent}
          />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: accent }]}>
            {correct ? 'Зөв байна!' : 'Энд нэг зүйл засъя'}
          </Text>
          {!correct && correctAnswer ? (
            <Text style={styles.detail}>Зөв хариулт: {correctAnswer}</Text>
          ) : null}
          {message ? <Text style={styles.detail}>{message}</Text> : null}
        </View>

        <Button
          label="ҮРГЭЛЖЛҮҮЛЭХ"
          onPress={onContinue}
          variant={correct ? 'success' : 'danger'}
          fullWidth={false}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { ...typography.heading.md },
  detail: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

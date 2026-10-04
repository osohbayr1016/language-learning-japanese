import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Screen } from '../../primitives';
import { colors, radius, spacing, tint, typography } from '../../theme';

type Props = {
  xp: number;
  total: number;
  correct: number;
};

export function SessionDoneScreen({ xp, total, correct }: Props) {
  const router = useRouter();
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={54} color={colors.text.inverse} />
        </View>

        <Text style={styles.eyebrow}>ДАДЛАГА ДУУСЛАА</Text>
        <Text style={styles.headline}>Сайн ажиллалаа!</Text>
        <Text style={styles.subtitle}>Өнөөдрийн жижиг алхам япон хэлэнд чинь нэмэгдлээ.</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="flash" size={22} color={colors.warning} />
            <Text style={styles.value}>+{xp}</Text>
            <Text style={styles.label}>XP</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.value}>{accuracy}%</Text>
            <Text style={styles.label}>нарийвчлал</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="layers" size={22} color={colors.accent.blue} />
            <Text style={styles.value}>{correct}/{total}</Text>
            <Text style={styles.label}>зөв</Text>
          </View>
        </View>

        <Button
          label="ҮРГЭЛЖЛҮҮЛЭХ"
          size="lg"
          onPress={() => router.replace('/study' as never)}
          style={styles.button}
        />
        <Button
          label="Суралцах зам руу"
          variant="ghost"
          onPress={() => router.replace('/home' as never)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  badge: {
    width: 98,
    height: 98,
    borderRadius: 34,
    backgroundColor: colors.success,
    borderBottomWidth: 7,
    borderBottomColor: '#1F6B42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.heading.xl,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  stat: {
    flex: 1,
    minHeight: 104,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: tint(colors.success, 0.03),
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  value: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginTop: 5,
  },
  label: {
    ...typography.body.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  button: { marginBottom: spacing.xs },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card } from '../../primitives';
import { colors, radius, spacing, tint, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = { dueCount: number };

/**
 * The app's primary "do this now" card. It has to answer two questions without
 * being read closely: is there work waiting, and what happens if I tap.
 */
export function DueTodayCard({ dueCount }: Props) {
  const router = useRouter();
  const has = dueCount > 0;

  const accent = has ? colors.brand.primary : colors.success;
  const icon = has ? 'time-outline' : 'checkmark-circle';

  return (
    <Card padding="lg" variant="elevated" style={styles.card} accent={accent}>
      <View style={styles.head}>
        <View style={[styles.iconBox, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons name={icon} size={26} color={accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{mn.home.dueToday}</Text>
          <Text style={styles.subtitle}>
            {has ? mn.home.dueWordsCount.replace('{n}', String(dueCount)) : mn.home.noDue}
          </Text>
        </View>
        {has ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{dueCount}</Text>
          </View>
        ) : null}
      </View>
      <Button
        label={has ? mn.home.continueStudy : mn.study.flashcard}
        variant={has ? 'primary' : 'secondary'}
        onPress={() => router.push('/study/flashcard')}
        rightIcon={
          <Ionicons
            name="arrow-forward"
            size={16}
            color={has ? colors.text.inverse : colors.text.primary}
          />
        }
        style={styles.cta}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1 },
  iconBox: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.heading.md, color: colors.text.primary },
  subtitle: { ...typography.body.md, color: colors.text.secondary, marginTop: 2 },
  countBadge: {
    minWidth: 34,
    paddingHorizontal: spacing.sm,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...typography.body.md, fontWeight: '800', color: colors.text.inverse },
  cta: { marginTop: spacing.md },
});

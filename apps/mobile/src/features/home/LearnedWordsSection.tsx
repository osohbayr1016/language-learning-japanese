import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { useLearnedWords } from '../../hooks/useLearnedWords';

export function LearnedWordsSection() {
  const router = useRouter();
  const { words, loading } = useLearnedWords();

  if (loading || words.length === 0) return null;

  const recent = [...words].reverse().slice(0, 6);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={18} color={colors.accent.amber} />
          </View>
          <Text style={styles.title}>Сурсан үгнүүд</Text>
        </View>
        <Pressable onPress={() => router.push('/profile/learned-words' as any)}>
          <Text style={styles.seeAll}>Бүгд ({words.length})</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recent.map((word) => (
          <Pressable
            key={String(word.id)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push(`/profile/learned-words` as any)}
          >
            <Text style={styles.kana}>{word.kana}</Text>
            {word.kanji ? <Text style={styles.kanji}>{word.kanji}</Text> : null}
            <Text style={styles.meaning} numberOfLines={1}>{word.meaning_mn}</Text>
          </Pressable>
        ))}

        <Pressable
          style={styles.viewAllCard}
          onPress={() => router.push('/profile/learned-words' as any)}
        >
          <Ionicons name="arrow-forward" size={22} color={colors.accent.amber} />
          <Text style={[styles.viewAllText, { color: colors.accent.amber }]}>Бүгд</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accent.amber + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  seeAll: {
    ...typography.body.sm,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  kana: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: 2,
  },
  kanji: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: 4,
  },
  meaning: {
    ...typography.body.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  viewAllCard: {
    width: 72,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent.amber + '60',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
    gap: 4,
  },
  viewAllText: {
    ...typography.body.xs,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../primitives';
import { useLearnedWords } from '../../hooks/useLearnedWords';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import type { LearnedWord } from '../../lib/learnedWordsStorage';

export function LearnedWordsScreen() {
  const router = useRouter();
  const { words, loading } = useLearnedWords();
  const sorted = [...words].reverse(); // newest first

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.brand.primary} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.pageTitle}>Сурсан үгнүүд</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{words.length}</Text>
        </View>
      </View>

      {words.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="library-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>Одоогоор сурсан үг байхгүй байна.</Text>
          <Text style={styles.emptyHint}>«Давтах» хэсгээс үг сурч эхлээрэй.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(w) => String(w.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <WordRow word={item} onPress={() =>
              router.push({ pathname: '/profile/learned-word-detail', params: { wordJson: JSON.stringify(item) } } as any)
            } />
          )}
        />
      )}
    </Screen>
  );
}

function WordRow({ word, onPress }: { word: LearnedWord; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.kana}>{word.kana}</Text>
        {word.kanji ? <Text style={styles.kanji}>{word.kanji}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.meaning}>{word.meaning_mn}</Text>
        {word.romaji ? <Text style={styles.romaji}>{word.romaji}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
    borderWidth: 1, borderColor: colors.border,
  },
  pageTitle: {
    ...typography.heading.sm,
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accent.amber + '20',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.body.sm,
    color: colors.accent.amber,
    fontWeight: '700',
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl,
  },
  emptyText: {
    ...typography.heading.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.body.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  rowLeft: { alignItems: 'center', minWidth: 60 },
  kana: { fontSize: 24, fontWeight: '800', color: colors.brand.primary },
  kanji: { fontSize: 13, color: colors.text.muted },
  rowRight: { flex: 1 },
  meaning: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  romaji: { ...typography.body.xs, color: colors.text.secondary },
});

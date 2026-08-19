import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../primitives';
import { CATEGORIES } from './StudyCasualWords';
import { useLearnedWords } from '../../hooks/useLearnedWords';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export function CategoryAllWordsScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { words: learnedWords } = useLearnedWords();
  const learnedIds = new Set(learnedWords.map((w) => String(w.id)));

  const cat = CATEGORIES.find((c) => c.id === category);
  if (!cat) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
          <Ionicons name={cat.icon as any} size={18} color={cat.color} />
        </View>
        <Text style={styles.title}>{cat.title}</Text>
        <Text style={styles.count}>{cat.words.length} үг</Text>
      </View>

      <FlatList
        data={cat.words}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const learned = learnedIds.has(item.id);
          return (
            <View style={[styles.row, learned && styles.rowLearned]}>
              <View style={styles.rowLeft}>
                <Text style={[styles.kana, { color: learned ? colors.text.muted : cat.color }]}>{item.kana}</Text>
                {item.kanji !== item.kana ? <Text style={styles.kanji}>{item.kanji}</Text> : null}
              </View>
              <View style={styles.rowMid}>
                <Text style={styles.meaning}>{item.meaning_mn}</Text>
                <Text style={styles.romaji}>{item.romaji}</Text>
              </View>
              {learned && (
                <View style={styles.learnedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent.teal} />
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.startBtn, { backgroundColor: cat.color }]}
          onPress={() => router.push(`/study/loop?category=${cat.id}` as any)}
        >
          <Text style={styles.startBtnText}>Энэ ангиллыг сурах</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.heading.sm, color: colors.text.primary, flex: 1 },
  count: { ...typography.body.sm, color: colors.text.muted, fontWeight: '600' },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    gap: spacing.md, ...shadows.sm,
  },
  rowLearned: { opacity: 0.55 },
  rowLeft: { alignItems: 'center', minWidth: 64 },
  kana: { fontSize: 22, fontWeight: '800' },
  kanji: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  rowMid: { flex: 1 },
  meaning: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  romaji: { ...typography.body.xs, color: colors.text.secondary },
  learnedBadge: { marginLeft: 'auto' },
  footer: {
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg.elevated,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: 30,
  },
  startBtnText: { ...typography.heading.sm, color: '#fff' },
});

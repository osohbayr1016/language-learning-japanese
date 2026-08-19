import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Pill } from '../../primitives';
import { useLearnedKanjis } from '../../hooks/useLearnedKanjis';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import type { LearnedKanji } from '../../lib/learnedKanjisStorage';
import { jlptNLabel } from '../../lib/jlptLabel';

export function LearnedKanjisScreen() {
  const router = useRouter();
  const { kanjis, loading } = useLearnedKanjis();
  const sorted = [...kanjis].reverse(); // newest first

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
        <Text style={styles.pageTitle}>Сурсан ханз</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{kanjis.length}</Text>
        </View>
      </View>

      {kanjis.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="text-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>Одоогоор сурсан ханз байхгүй байна.</Text>
          <Text style={styles.emptyHint}>Ханз хэсгээс ханз сурч эхлэнэ үү!</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(w) => String(w.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <KanjiRow
              kanji={item}
              onPress={() => router.push({ pathname: '/kanji/[id]', params: { id: String(item.id) } } as any)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function KanjiRow({ kanji, onPress }: { kanji: LearnedKanji; onPress: () => void }) {
  const hskColor = colors.jlpt[kanji.jlpt_level as keyof typeof colors.jlpt] || colors.brand.primary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.rowLeft, { borderColor: hskColor + '40' }]}>
        <Text style={styles.kanji}>{kanji.kanji}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.meaning}>{kanji.meaning_mn}</Text>
        {kanji.romaji ? <Text style={styles.romaji}>{kanji.romaji}</Text> : null}
        <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
          <Pill label={jlptNLabel(kanji.jlpt_level)} color={hskColor} size="sm" />
        </View>
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
    backgroundColor: colors.brand.primary + '20',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.body.sm,
    color: colors.brand.primaryDark,
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
  rowLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.bg.primary,
    borderWidth: 1.5,
  },
  kanji: { fontSize: 28, fontWeight: '800', color: colors.text.primary },
  rowRight: { flex: 1 },
  meaning: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  romaji: { ...typography.body.xs, color: colors.text.secondary },
});

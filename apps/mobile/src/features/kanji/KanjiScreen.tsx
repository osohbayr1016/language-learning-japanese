import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../primitives';
import { colors, radius, shadows, spacing, tint, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { api } from '../../lib/api';
import type { Word, WordWithProgress } from '../../lib/types';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { jlptNLabel } from '../../lib/jlptLabel';

type ProgressState = 'none' | 'learned' | 'mastered';

function getProgressState(wp: WordWithProgress): ProgressState {
  if ((wp.repetitions ?? 0) >= 3) return 'mastered';
  if ((wp.repetitions ?? 0) >= 1) return 'learned';
  return 'none';
}

export default function KanjiScreen() {
  const [kanjis, setKanjis] = useState<Word[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressState>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.words.list({ single_char: 1, limit: 500 });
      setKanjis(res.data);

      if (token) {
        // Fetch all pages of user vocabulary to build progress map
        const vocabRes = await api.user.vocabulary(token, { limit: 500 });
        const map: Record<number, ProgressState> = {};
        for (const w of vocabRes.data) {
          map[w.id] = getProgressState(w);
        }
        setProgressMap(map);
      }
    } catch (e) {
      console.error('Failed to load kanjis:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const grouped = kanjis.reduce((acc, word) => {
    const lvl = word.jlpt_level || 1;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(word);
    return acc;
  }, {} as Record<number, Word[]>);

  const levels = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  // Compute per-level progress summary
  const levelStats = levels.reduce((acc, lvl) => {
    const words = grouped[lvl];
    const learned = words.filter(w => progressMap[w.id] && progressMap[w.id] !== 'none').length;
    acc[lvl] = { total: words.length, learned };
    return acc;
  }, {} as Record<number, { total: number; learned: number }>);

  return (
    <Screen scroll scrollBottomInset={70}>
      <View style={styles.header}>
        <Text style={styles.title}>{mn.kanji.title}</Text>
        <Text style={styles.subtitle}>{mn.kanji.subtitle}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : levels.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{mn.kanji.empty}</Text>
        </View>
      ) : (
        levels.map((lvl) => {
          const stats = levelStats[lvl];
          const hskColor = colors.jlpt[lvl as keyof typeof colors.jlpt] ?? colors.brand.primary;
          const pct = stats.total > 0 ? stats.learned / stats.total : 0;
          return (
            <View key={lvl} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={[styles.hskBadge, { backgroundColor: hskColor + '20', borderColor: hskColor + '60' }]}>
                  <Text style={[styles.hskBadgeText, { color: hskColor }]}>{jlptNLabel(lvl)}</Text>
                </View>
                <View style={styles.sectionMeta}>
                  <Text style={styles.sectionProgressText}>
                    {stats.learned} / {stats.total} суралаа
                  </Text>
                  <View style={styles.sectionProgressBar}>
                    <View style={[styles.sectionProgressFill, { width: `${pct * 100}%` as any, backgroundColor: hskColor }]} />
                  </View>
                </View>
              </View>

              <View style={styles.grid}>
                {grouped[lvl].map((word) => {
                  const state = progressMap[word.id] ?? 'none';
                  const hskC = colors.jlpt[word.jlpt_level as keyof typeof colors.jlpt] ?? colors.brand.primary;
                  return (
                    <Pressable
                      key={word.id}
                      style={({ pressed }) => [
                        styles.card,
                        state === 'mastered' && styles.cardMastered,
                        state === 'learned' && styles.cardLearned,
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => {
                        router.push({
                          pathname: '/kanji/[id]',
                          params: { id: word.id },
                        });
                      }}
                    >
                      {/* Progress badge */}
                      {state === 'mastered' && (
                        <View style={[styles.badge, styles.badgeMastered]}>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                      )}
                      {state === 'learned' && (
                        <View style={[styles.badge, styles.badgeLearned]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}

                      <Text style={[styles.hanzi, state !== 'none' && styles.hanziLearned]}>
                        {word.kanji}
                      </Text>
                      <Text style={styles.pinyin} numberOfLines={1}>{word.romaji}</Text>
                      <Text style={styles.meaning} numberOfLines={1}>{word.meaning_mn}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.brand.primary + '15',
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary + '40',
  },
  title: {
    ...typography.heading.lg,
    color: colors.brand.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
  },
  center: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    ...typography.body.md,
    color: colors.text.muted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  hskBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  hskBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionMeta: {
    flex: 1,
    gap: 4,
  },
  sectionProgressText: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  sectionProgressBar: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  sectionProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '31%',
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    aspectRatio: 1,
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  cardLearned: {
    borderColor: colors.brand.primary + '80',
    backgroundColor: colors.brand.primary + '08',
  },
  cardMastered: {
    borderColor: colors.accent.amber,
    backgroundColor: tint(colors.accent.amber, 0.07),
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLearned: {
    backgroundColor: colors.brand.primary,
  },
  badgeMastered: {
    // Was #FFC800: a white star on it sat at 1.55:1 and read as an empty dot.
    backgroundColor: colors.accent.amber,
  },
  hanzi: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  hanziLearned: {
    color: colors.brand.primaryDark,
  },
  pinyin: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  meaning: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 1,
    textAlign: 'center',
  },
});

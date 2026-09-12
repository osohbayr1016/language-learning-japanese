import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Input, Screen } from "../../primitives";
import { colors, radius, shadows, spacing, tint, typography } from "../../theme";
import { mn } from "../../i18n/mn";
import { api } from "../../lib/api";
import type { Word, WordWithProgress } from "../../lib/types";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { jlptNLabel } from "../../lib/jlptLabel";
import { isSingleKanjiGlyphOnly } from "../../lib/japanese/hanScript";
import { KanjiWriteDialog } from "./KanjiWriteDialog";

type ProgressState = "none" | "learned" | "mastered";

function pronunciationLine(w: Word): string {
  const r = w.romaji?.trim() ?? "";
  if (r) return r;
  return w.meaning_en?.trim() ?? "";
}

function isSingleKanjiStudyEntry(w: Word): boolean {
  if (!isSingleKanjiGlyphOnly(w.kanji)) return false;
  return pronunciationLine(w).length > 0;
}

function getProgressState(wp: WordWithProgress): ProgressState {
  if ((wp.repetitions ?? 0) >= 3) return "mastered";
  if ((wp.repetitions ?? 0) >= 1) return "learned";
  return "none";
}

export default function KanjiScreen() {
  const [kanjis, setKanjis] = useState<Word[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressState>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [strokeWord, setStrokeWord] = useState<Word | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const router = useRouter();
  const { token } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.words.list({ single_char: 1, limit: 500 });
      const raw = res.data ?? [];
      setKanjis(raw.filter(isSingleKanjiStudyEntry));

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
      console.error("Failed to load kanjis:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const allLevels = useMemo(
    () =>
      [...new Set(kanjis.map((w) => w.jlpt_level || 1))].sort((a, b) => a - b),
    [kanjis],
  );

  // Search matches the glyph, its reading, or either meaning, so "水", "mizu"
  // and "ус" all land on the same tile.
  const q = query.trim().toLowerCase();
  const visible = kanjis.filter((w) => {
    if (levelFilter !== null && (w.jlpt_level || 1) !== levelFilter) return false;
    if (!q) return true;
    return [w.kanji, w.kana, w.romaji, w.meaning_mn, w.meaning_en]
      .filter(Boolean)
      .some((f) => String(f).toLowerCase().includes(q));
  });

  const grouped = visible.reduce(
    (acc, word) => {
      const lvl = word.jlpt_level || 1;
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(word);
      return acc;
    },
    {} as Record<number, Word[]>,
  );

  const levels = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  // Compute per-level progress summary
  const levelStats = levels.reduce(
    (acc, lvl) => {
      const words = grouped[lvl];
      const learned = words.filter(
        (w) => progressMap[w.id] && progressMap[w.id] !== "none",
      ).length;
      acc[lvl] = { total: words.length, learned };
      return acc;
    },
    {} as Record<number, { total: number; learned: number }>,
  );

  return (
    <Screen scroll scrollBottomInset={70}>
      <View style={styles.header}>
        <Text style={styles.title}>{mn.kanji.title}</Text>
        <Text style={styles.subtitle}>{mn.kanji.subtitle}</Text>
      </View>

      {!loading && kanjis.length > 0 ? (
        <View style={styles.filters}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={mn.kanji.searchPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leftIcon={<Ionicons name="search" size={18} color={colors.text.muted} />}
            rightIcon={
              query ? (
                <Pressable
                  onPress={() => setQuery("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={mn.kanji.clearSearch}
                >
                  <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                </Pressable>
              ) : undefined
            }
          />
          {allLevels.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {[null, ...allLevels].map((lvl) => {
                const active = levelFilter === lvl;
                const c =
                  lvl === null
                    ? colors.brand.primary
                    : (colors.jlpt[lvl as keyof typeof colors.jlpt] ?? colors.brand.primary);
                return (
                  <Pressable
                    key={String(lvl)}
                    onPress={() => setLevelFilter(lvl)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.chip,
                      active && { backgroundColor: c, borderColor: c },
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {lvl === null ? mn.kanji.allLevels : jlptNLabel(lvl)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
          {q ? (
            <Text style={styles.resultCount}>
              {mn.kanji.resultCount.replace("{n}", String(visible.length))}
            </Text>
          ) : null}
        </View>
      ) : null}

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
          const hskColor =
            colors.jlpt[lvl as keyof typeof colors.jlpt] ??
            colors.brand.primary;
          const pct = stats.total > 0 ? stats.learned / stats.total : 0;
          return (
            <View key={lvl} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.hskBadge,
                    {
                      backgroundColor: hskColor + "20",
                      borderColor: hskColor + "60",
                    },
                  ]}
                >
                  <Text style={[styles.hskBadgeText, { color: hskColor }]}>
                    {jlptNLabel(lvl)}
                  </Text>
                </View>
                <View style={styles.sectionMeta}>
                  <Text style={styles.sectionProgressText}>
                    {stats.learned} / {stats.total} суралаа
                  </Text>
                  <View style={styles.sectionProgressBar}>
                    <View
                      style={[
                        styles.sectionProgressFill,
                        {
                          width: `${pct * 100}%` as any,
                          backgroundColor: hskColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.grid}>
                {grouped[lvl].map((word) => {
                  const state = progressMap[word.id] ?? "none";
                  const hskC =
                    colors.jlpt[word.jlpt_level as keyof typeof colors.jlpt] ??
                    colors.brand.primary;
                  return (
                    <View key={word.id} style={styles.cardWrapper}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.card,
                          state === "mastered" && styles.cardMastered,
                          state === "learned" && styles.cardLearned,
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => {
                          router.push({
                            pathname: "/kanji/[id]",
                            params: { id: word.id },
                          });
                        }}
                      >
                        {state === "mastered" && (
                          <View style={[styles.badge, styles.badgeMastered]}>
                            <Ionicons name="star" size={10} color="#fff" />
                          </View>
                        )}
                        {state === "learned" && (
                          <View style={[styles.badge, styles.badgeLearned]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                        <Text
                          style={[
                            styles.hanzi,
                            state !== "none" && styles.hanziLearned,
                          ]}
                        >
                          {word.kanji}
                        </Text>
                        <Text style={styles.pinyin} numberOfLines={1}>
                          {pronunciationLine(word)}
                        </Text>
                        <Text style={styles.meaning} numberOfLines={1}>
                          {word.meaning_mn}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.strokeFab, { borderColor: hskC + "60" }]}
                        onPress={() => setStrokeWord(word)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={mn.writer.watch}
                      >
                        <Ionicons name="create-outline" size={16} color={hskC} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
      )}

      <KanjiWriteDialog
        visible={strokeWord !== null}
        kanji={strokeWord?.kanji ?? ""}
        romaji={strokeWord?.romaji}
        meaning={strokeWord?.meaning_mn}
        onClose={() => setStrokeWord(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.brand.primary + "15",
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary + "40",
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
    alignItems: "center",
  },
  filters: { marginBottom: spacing.md, gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg.card,
  },
  chipText: { ...typography.body.sm, fontWeight: "700", color: colors.text.secondary },
  chipTextActive: { color: colors.text.inverse },
  resultCount: { ...typography.body.sm, color: colors.text.muted },
  empty: {
    ...typography.body.md,
    color: colors.text.muted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "800",
  },
  sectionMeta: {
    flex: 1,
    gap: 4,
  },
  sectionProgressText: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  sectionProgressBar: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  sectionProgressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardWrapper: {
    width: "31%",
    position: "relative",
  },
  card: {
    width: "100%",
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    aspectRatio: 1,
    justifyContent: "center",
    position: "relative",
    ...shadows.sm,
  },
  cardLearned: {
    borderColor: colors.brand.primary + "80",
    backgroundColor: colors.brand.primary + "08",
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
    position: "absolute",
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLearned: {
    backgroundColor: colors.brand.primary,
  },
  badgeMastered: {
    backgroundColor: colors.accent.amber,
  },
  hanzi: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  hanziLearned: {
    color: colors.brand.primaryDark,
  },
  pinyin: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: "center",
  },
  meaning: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
    textAlign: "center",
  },
  strokeFab: {
    position: "absolute",
    bottom: -8,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bg.primary,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...shadows.sm,
  },
});

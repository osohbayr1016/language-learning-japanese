import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../primitives';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import type { LearnedWord } from '../../lib/learnedWordsStorage';
import { HanziWriterView, type HanziWriterMode } from '../../components/writing/HanziWriterView';
import { PronounceButton } from '../../components/audio/PronounceButton';

export function LearnedWordDetailScreen() {
  const router = useRouter();
  const { wordJson } = useLocalSearchParams<{ wordJson: string }>();
  const { width } = useWindowDimensions();
  const canvasSize = Math.min(width - spacing.xl * 4, 260);

  const [mode, setMode] = useState<HanziWriterMode>('animate');

  let word: LearnedWord | null = null;
  try {
    if (wordJson) word = JSON.parse(wordJson) as LearnedWord;
  } catch {}

  if (!word) {
    return (
      <Screen>
        <Text style={styles.err}>Үг олдсонгүй.</Text>
      </Screen>
    );
  }

  // Build list of all characters to show stroke order for
  const allChars = (() => {
    const chars: string[] = [];
    // First add kana chars
    for (const c of Array.from(word.kana)) chars.push(c);
    // Then kanji chars if different
    if (word.kanji && word.kanji !== word.kana) {
      for (const c of Array.from(word.kanji)) {
        if (!chars.includes(c)) chars.push(c);
      }
    }
    return chars;
  })();

  return (
    <Screen scroll>
      {/* Back bar */}
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.pageTitle}>{word.kana}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main word card */}
        <View style={styles.card}>
          <Text style={styles.kana}>{word.kana}</Text>
          {word.kanji ? <Text style={styles.kanji}>{word.kanji}</Text> : null}
          {word.romaji ? <Text style={styles.romaji}>{word.romaji}</Text> : null}
          <Text style={styles.meaning}>{word.meaning_mn}</Text>
          <View style={styles.audioRow}>
            <PronounceButton wordId={word.id as any} meaningMn={word.meaning_mn} size="lg" />
            <Text style={styles.audioHint}>Дуудлага сонсох</Text>
          </View>
        </View>

        {/* Stroke order section — show each character */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Бичих дараалал</Text>

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, mode === 'animate' && styles.modeBtnActive]}
              onPress={() => setMode('animate')}
            >
              <Ionicons name="play-circle" size={18} color={mode === 'animate' ? colors.brand.primary : colors.text.secondary} />
              <Text style={[styles.modeTxt, mode === 'animate' && styles.modeTxtActive]}>Харж сурах</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'quiz' && styles.modeBtnActive]}
              onPress={() => setMode('quiz')}
            >
              <Ionicons name="pencil" size={18} color={mode === 'quiz' ? colors.brand.primary : colors.text.secondary} />
              <Text style={[styles.modeTxt, mode === 'quiz' && styles.modeTxtActive]}>Өөрөө бичих</Text>
            </Pressable>
          </View>

          <Text style={styles.charNote}>
            {allChars.length > 1 ? `${allChars.length} тэмдэгт — дарааллаар харуулна` : ''}
          </Text>

          {allChars.map((char, i) => (
            <View key={`${char}-${i}`} style={styles.charBlock}>
              <Text style={styles.charLabel}>{char}</Text>
              <View style={styles.canvas}>
                <HanziWriterView
                  key={`${char}-${mode}`}
                  char={char}
                  mode={mode}
                  size={canvasSize}
                  strokeColor={colors.accent.purple}
                  outlineColor={colors.border}
                  onEvent={() => {}}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  err: { ...typography.body.md, color: colors.accent.pink, padding: spacing.md },
  backBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border,
  },
  pageTitle: { ...typography.heading.sm, color: colors.text.primary },
  content: { padding: spacing.md, gap: spacing.xl },
  card: {
    backgroundColor: colors.bg.elevated, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadows.md,
  },
  kana: { fontSize: 52, fontWeight: '800', color: colors.brand.primary },
  kanji: { fontSize: 22, color: colors.text.muted },
  romaji: { ...typography.romaji.lg, color: colors.text.secondary },
  meaning: { ...typography.heading.md, color: colors.text.primary, textAlign: 'center' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  audioHint: { ...typography.body.sm, color: colors.text.muted },
  section: {
    backgroundColor: colors.bg.card, borderRadius: radius.xl,
    padding: spacing.lg, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { ...typography.heading.sm, color: colors.text.primary },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bg.elevated,
  },
  modeBtnActive: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '15' },
  modeTxt: { ...typography.body.sm, color: colors.text.secondary, fontWeight: '600' },
  modeTxtActive: { color: colors.brand.primary },
  charNote: { ...typography.body.xs, color: colors.text.muted },
  charBlock: { alignItems: 'center', gap: spacing.sm },
  charLabel: { fontSize: 20, fontWeight: '700', color: colors.text.secondary },
  canvas: {
    backgroundColor: colors.bg.default, borderRadius: radius.md,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
});

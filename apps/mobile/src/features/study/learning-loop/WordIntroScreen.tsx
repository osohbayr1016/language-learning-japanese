import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../../theme';
import type { CasualStudyWord } from './types';
import { PronounceButton } from '../../../components/audio/PronounceButton';
import { useAudio } from '../../../context/AudioContext';
import { HanziWriterView } from '../../../components/writing/HanziWriterView';

type WordIntroScreenProps = {
  words: CasualStudyWord[];
  onFinish: (words: CasualStudyWord[]) => void;
};

export function WordIntroScreen({ words, onFinish }: WordIntroScreenProps) {
  const [idx, setIdx] = useState(0);
  const { playWord } = useAudio();
  const { width } = useWindowDimensions();

  const current = words[idx];
  const isLast = idx === words.length - 1;

  // Auto-play audio after 2 seconds
  useEffect(() => {
    if (!current) return;
    
    // Some mock words have string IDs, but playWord expects a number usually.
    // If it's a mock word, it might fail or we might not have audio.
    // The existing code handles it gracefully if the ID doesn't exist.
    const timer = setTimeout(() => {
      // In a real app, ensure word.id is numeric or supported by the audio engine
      // Local casual words do not have server audio IDs; browser/native TTS button remains available.
    }, 2000);

    return () => clearTimeout(timer);
  }, [current, playWord]);

  if (!current) return null;

  const handleNext = () => {
    if (isLast) {
      onFinish(words);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const firstChar = Array.from(current.kanji || current.kana)[0] ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Шинэ үг сурах</Text>
        <Text style={styles.progress}>{idx + 1} / {words.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Hiragana first as requested */}
          <Text style={styles.kana}>{current.kana}</Text>
          
          {current.kanji ? (
            <Text style={styles.kanji}>{current.kanji}</Text>
          ) : null}

          <Text style={styles.romaji}>{current.romaji}</Text>
          <Text style={styles.meaning}>{current.meaning_mn}</Text>
          
          <View style={styles.audioWrapper}>
             <PronounceButton text={current.kanji || current.kana} meaningMn={current.meaning_mn} size="lg" />
          </View>
        </View>

        <View style={styles.strokeContainer}>
          <Text style={styles.strokeTitle}>Бичих дараалал</Text>
          <View style={styles.canvasWrap}>
            <HanziWriterView
              key={`${current.id}-animate`}
              char={firstChar}
              mode="animate"
              size={Math.min(width - spacing.xl * 2, 200)}
              strokeColor={colors.accent.amber}
              outlineColor={colors.border}
              onEvent={() => {}}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.navBtnPrimary} onPress={handleNext}>
          <Text style={styles.navBtnPrimaryText}>
            {isLast ? "Үргэлжлүүлэх" : "Дараах үг"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  progress: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  kana: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  kanji: {
    fontSize: 24,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  romaji: {
    ...typography.romaji.lg,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  meaning: {
    ...typography.heading.md,
    color: colors.text.primary,
    textAlign: 'center',
  },
  audioWrapper: {
    marginTop: spacing.xl,
  },
  strokeContainer: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  strokeTitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  canvasWrap: {
    backgroundColor: colors.bg.default,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
  },
  navBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
  },
  navBtnPrimaryText: {
    ...typography.heading.sm,
    color: colors.text.inverse,
  },
});

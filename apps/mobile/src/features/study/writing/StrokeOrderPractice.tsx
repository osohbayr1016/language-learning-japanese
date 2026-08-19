import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../../theme';
import { HanziWriterView, type HanziWriterMode } from '../../../components/writing/HanziWriterView';
import type { Word } from '@japanese-learning/db';

type StrokeOrderPracticeProps = {
  words: Word[];
  onFinish: () => void;
};

export function StrokeOrderPractice({ words, onFinish }: StrokeOrderPracticeProps) {
  const { width } = useWindowDimensions();
  const canvasSize = Math.min(width - spacing.lg * 2, 320);

  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<HanziWriterMode>('quiz');

  const current = words[idx];
  // Prefer Kanji if available, else first kana character. 
  // For a full implementation, we might split string into chars and allow navigating them,
  // but for simplicity, we pick the first character of the kanji or kana.
  const firstChar = current ? (current.kanji ? Array.from(current.kanji)[0] : Array.from(current.kana)[0]) : '';

  const handleNext = () => {
    if (idx + 1 >= words.length) {
      onFinish();
    } else {
      setIdx(idx + 1);
      setMode('quiz');
    }
  };

  const handlePrev = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      setMode('quiz');
    }
  };

  if (!current) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Бичих дараалал сурах</Text>
        <Text style={styles.progress}>{idx + 1} / {words.length}</Text>
      </View>

      <View style={styles.wordInfo}>
        <Text style={styles.meaning}>{current.meaning_mn}</Text>
        <Text style={styles.kana}>{current.kana}</Text>
      </View>

      <View style={styles.canvasWrap}>
        <HanziWriterView
          key={`${current.id}-${mode}`}
          char={firstChar}
          mode={mode}
          size={canvasSize}
          strokeColor={colors.accent.purple}
          outlineColor={colors.border}
          onEvent={() => {}}
        />
      </View>

      <View style={styles.modeControls}>
        <Pressable 
          style={[styles.modeBtn, mode === 'animate' && styles.modeBtnActive]} 
          onPress={() => setMode('animate')}
        >
          <Ionicons name="play-circle" size={24} color={mode === 'animate' ? colors.brand.primary : colors.text.secondary} />
          <Text style={[styles.modeText, mode === 'animate' && styles.modeTextActive]}>Харж сурах</Text>
        </Pressable>
        <Pressable 
          style={[styles.modeBtn, mode === 'quiz' && styles.modeBtnActive]} 
          onPress={() => setMode('quiz')}
        >
          <Ionicons name="pencil" size={24} color={mode === 'quiz' ? colors.brand.primary : colors.text.secondary} />
          <Text style={[styles.modeText, mode === 'quiz' && styles.modeTextActive]}>Өөрөө бичих</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.navBtn, idx === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={idx === 0}
        >
          <Ionicons name="arrow-back" size={24} color={idx === 0 ? colors.text.muted : colors.text.primary} />
        </Pressable>

        <Pressable style={styles.navBtnPrimary} onPress={handleNext}>
          <Text style={styles.navBtnPrimaryText}>
            {idx + 1 >= words.length ? "Дуусгах" : "Дараах үг"}
          </Text>
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  progress: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  wordInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  meaning: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  kana: {
    ...typography.body.lg,
    color: colors.text.secondary,
  },
  canvasWrap: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  modeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.elevated,
    gap: spacing.sm,
  },
  modeBtnActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '10',
  },
  modeText: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modeTextActive: {
    color: colors.brand.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnPrimary: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
  },
  navBtnPrimaryText: {
    ...typography.body.md,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

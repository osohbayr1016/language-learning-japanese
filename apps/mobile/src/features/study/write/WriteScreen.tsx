import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '../../../primitives';
import { useDueWords } from '../../../hooks/useDueWords';
import { useSrsRating } from '../../../hooks/useSrsRating';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { useAudio } from '../../../context/AudioContext';
import { calculateXP } from '@japanese-learning/srs';
import { sessionXpIncludingFinal } from '../../../lib/sessionXp';
import { normalizeRomaji } from '../../../lib/romaji';
import { colors, spacing } from '../../../theme';
import { mn } from '../../../i18n/mn';
import { StudyHeader } from '../StudyHeader';
import { StudyEmptyState } from '../EmptyState';
import { SessionDoneScreen } from '../SessionDoneScreen';
import { PromptCard } from './PromptCard';
import { AnswerInput } from './AnswerInput';
import { RevealCard } from './RevealCard';
import type { WordWithProgress } from '../../../lib/types';

function isAnswerCorrect(input: string, word: WordWithProgress): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed === word.kanji) return true;
  return normalizeRomaji(trimmed) === normalizeRomaji(word.romaji);
}

export default function WriteScreen() {
  const { words, loading, error } = useDueWords(10);
  const session = useSrsRating('write');
  const timer = useAdaptiveTimer();
  const { playWord } = useAudio();

  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState<{ correct: boolean } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [pendingXp, setPendingXp] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const current = words[idx];

  useEffect(() => { if (current) timer.start(); }, [current, timer]);

  const xp = useMemo(
    () => calculateXP({ type: 'write', correct: correctCount, total: words.length }),
    [correctCount, words.length]
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}><ActivityIndicator color={colors.accent.purple} /></View>
      </Screen>
    );
  }
  if (words.length === 0) {
    return <StudyEmptyState message={error ? mn.study.wordsLoadError : undefined} />;
  }
  if (done) return <SessionDoneScreen xp={xp} total={words.length} correct={correctCount} />;
  if (pendingXp !== null) return (
    <Screen>
      <StudyHeader title={mn.study.write} index={words.length - 1} total={words.length} />
      <Text accessibilityRole="alert" style={{ color: colors.error, marginBottom: spacing.md }}>
        {saving ? 'Ахиц хадгалж байна…' : 'Бичгийн ахиц хадгалагдсангүй. Хариулт хэвээр, дахин илгээх боломжтой.'}
      </Text>
      <Button label="ДАХИН ХАДГАЛАХ" loading={saving} disabled={saving}
        onPress={() => {
          void (async () => {
            setSaving(true);
            try {
              if (await session.flush(pendingXp)) { setPendingXp(null); setDone(true); }
            } finally { setSaving(false); }
          })();
        }} />
    </Screen>
  );

  const handleSubmit = async (val: string) => {
    if (!current || reveal) return;
    const responseMs = timer.stopAndReset();
    const ok = isAnswerCorrect(val, current);
    setReveal({ correct: ok });
    if (ok) {
      setCorrectCount((n) => n + 1);
      void playWord(current.id);
    }
    session.record(
      current.id,
      { ease_factor: current.ease_factor, interval: current.interval, repetitions: current.repetitions },
      { rating: ok ? 4 : 1, responseMs }
    );
    setTimeout(async () => {
      setReveal(null);
      if (idx + 1 >= words.length) {
        const finalXp = sessionXpIncludingFinal('write', correctCount, ok, words.length);
        setPendingXp(finalXp);
        setSaving(true);
        try {
          if (await session.flush(finalXp)) {
            setPendingXp(null);
            setDone(true);
          }
        } finally { setSaving(false); }
      } else {
        setIdx((i) => i + 1);
      }
    }, 1400);
  };

  return (
    <Screen scroll={false}>
      <StudyHeader title={mn.study.write} index={idx} total={words.length} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <PromptCard word={current!} />
          {reveal ? (
            <RevealCard word={current!} isCorrect={reveal.correct} />
          ) : (
            <AnswerInput disabled={!!reveal} onSubmit={handleSubmit} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // The input sits right under the prompt; a 'space-between' layout used to
  // push it to the bottom of the screen with a screen-high gap.
  body: { flex: 1, justifyContent: 'flex-start', gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
});

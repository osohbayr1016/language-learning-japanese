import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Screen } from '../../../primitives';
import { useDueWords } from '../../../hooks/useDueWords';
import { useSrsRating } from '../../../hooks/useSrsRating';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { useAudio } from '../../../context/AudioContext';
import { calculateXP } from '@japanese-learning/srs';
import { stripToneMarks } from '../../../lib/tones';
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
  return stripToneMarks(trimmed) === stripToneMarks(word.romaji);
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

  const handleSubmit = async (val: string) => {
    if (!current) return;
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
        await session.flush(xp);
        setDone(true);
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

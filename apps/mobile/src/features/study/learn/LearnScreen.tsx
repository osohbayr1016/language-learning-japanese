import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Screen } from '../../../primitives';
import { useStudyWords, type StudyWordSource } from '../../../hooks/useStudyWords';
import { useSrsRating } from '../../../hooks/useSrsRating';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { useAudio } from '../../../context/AudioContext';
import { calculateXP } from '@japanese-learning/srs';
import { colors, spacing } from '../../../theme';
import { mn } from '../../../i18n/mn';
import { StudyHeader } from '../StudyHeader';
import { StudyEmptyState } from '../EmptyState';
import { SessionDoneScreen } from '../SessionDoneScreen';
import { QuestionCard } from './QuestionCard';
import { AnswerOption } from './AnswerOption';
import { difficultyForAccuracy, pickDistractors, shuffle } from './distractors';
import type { WordWithProgress } from '../../../lib/types';
import { PinyinToggleWeb } from '../PinyinToggleWeb';

const OPTIONS = 4;

type Props = { source?: StudyWordSource };

export function LearnScreen({ source = 'due' }: Props) {
  const { words, loading, error } = useStudyWords(source, 15);
  const session = useSrsRating('learn');
  const timer = useAdaptiveTimer();
  const { playWord } = useAudio();

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<WordWithProgress | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = words[idx];

  const accuracy = idx > 0 ? correctCount / idx : 0;
  const difficulty = difficultyForAccuracy(accuracy);

  const promptType: 'jp-to-mn' | 'mn-to-jp' = idx % 2 === 0 ? 'jp-to-mn' : 'mn-to-jp';

  const options = useMemo(() => {
    if (!current) return [] as WordWithProgress[];
    const distractors = pickDistractors(words, current, OPTIONS - 1, difficulty);
    return shuffle([current, ...distractors]);
  }, [current, words, difficulty]);

  useEffect(() => { if (current) timer.start(); }, [current, timer]);

  const xp = useMemo(
    () => calculateXP({ type: 'learn', correct: correctCount, total: words.length }),
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
    return (
      <StudyEmptyState
        kind={error ? 'error' : 'empty'}
        message={
          error
            ? mn.study.wordsLoadError
            : source === 'weak'
              ? mn.study.weakReviewEmpty
              : undefined
        }
      />
    );
  }
  if (done) return <SessionDoneScreen xp={xp} total={words.length} correct={correctCount} />;

  const handleSelect = async (chosen: WordWithProgress) => {
    if (!current || answered) return;
    const responseMs = timer.stopAndReset();
    const isCorrect = chosen.id === current.id;
    setAnswered(chosen);
    if (isCorrect) {
      setCorrectCount((n) => n + 1);
      void playWord(current.id);
    }
    session.record(
      current.id,
      { ease_factor: current.ease_factor, interval: current.interval, repetitions: current.repetitions },
      { rating: isCorrect ? 4 : 1, responseMs }
    );

    setTimeout(async () => {
      setAnswered(null);
      if (idx + 1 >= words.length) {
        await session.flush(xp + (isCorrect ? 5 : 0));
        setDone(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, 900);
  };

  return (
    <Screen scroll={false}>
      <StudyHeader
        title={source === 'weak' ? mn.study.weakReviewTitle : mn.study.learn}
        index={idx}
        total={words.length}
        trailing={Platform.OS === 'web' ? <PinyinToggleWeb /> : undefined}
      />
      <View style={styles.body}>
        <QuestionCard word={current!} promptType={promptType} />
        {options.map((o) => {
          let state: 'idle' | 'correct' | 'wrong' | 'reveal' = 'idle';
          if (answered) {
            if (o.id === current!.id) state = 'correct';
            else if (o.id === answered.id) state = 'wrong';
            else state = 'idle';
          }
          return (
            <AnswerOption
              key={o.id}
              word={o}
              show={promptType === 'jp-to-mn' ? 'mn' : 'jp'}
              state={state}
              onPress={() => handleSelect(o)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingTop: spacing.md },
});

export default LearnScreen;

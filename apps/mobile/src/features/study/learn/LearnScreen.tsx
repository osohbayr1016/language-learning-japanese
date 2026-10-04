import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '../../../primitives';
import { useStudyWords, type StudyWordSource } from '../../../hooks/useStudyWords';
import { useSrsRating } from '../../../hooks/useSrsRating';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { useAudio } from '../../../context/AudioContext';
import { calculateXP } from '@japanese-learning/srs';
import { colors, radius, spacing, tint, typography } from '../../../theme';
import { mn } from '../../../i18n/mn';
import { StudyHeader } from '../StudyHeader';
import { StudyEmptyState } from '../EmptyState';
import { SessionDoneScreen } from '../SessionDoneScreen';
import { QuestionCard } from './QuestionCard';
import { AnswerOption } from './AnswerOption';
import { difficultyForAccuracy, pickDistractors, shuffle } from './distractors';
import type { WordWithProgress } from '../../../lib/types';
import { RomajiToggleWeb } from '../RomajiToggleWeb';

const OPTIONS = 4;

type Props = { source?: StudyWordSource };

type AnswerState = {
  chosenId: number;
  correct: boolean;
};

export function LearnScreen({ source = 'due' }: Props) {
  const { words, loading, error } = useStudyWords(source, 15);
  const session = useSrsRating('learn');
  const timer = useAdaptiveTimer();
  const { playWord } = useAudio();

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<AnswerState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = words[idx];

  const accuracy = idx > 0 ? correctCount / idx : 0;
  const difficulty = difficultyForAccuracy(accuracy);
  const promptType: 'jp-to-mn' | 'mn-to-jp' = idx % 2 === 0 ? 'jp-to-mn' : 'mn-to-jp';

  const options = useMemo(() => {
    if (!current) return [] as WordWithProgress[];
    const distractors = pickDistractors(words, current, OPTIONS - 1, difficulty);
    return shuffle([current, ...distractors]);
  }, [current, words, difficulty]);

  useEffect(() => {
    if (current && !answer) timer.start();
  }, [current, answer, timer]);

  const xp = useMemo(
    () => calculateXP({ type: 'learn', correct: correctCount, total: words.length }),
    [correctCount, words.length],
  );

  const handleSelect = useCallback(
    (chosen: WordWithProgress) => {
      if (!current || answer) return;
      const responseMs = timer.stopAndReset();
      const isCorrect = chosen.id === current.id;

      setAnswer({ chosenId: chosen.id, correct: isCorrect });
      if (isCorrect) {
        setCorrectCount((n) => n + 1);
        void playWord(current.id);
      }

      session.record(
        current.id,
        {
          ease_factor: current.ease_factor,
          interval: current.interval,
          repetitions: current.repetitions,
        },
        { rating: isCorrect ? 4 : 1, responseMs },
      );
    },
    [answer, current, playWord, session, timer],
  );

  const handleContinue = useCallback(async () => {
    if (!answer || saving) return;

    if (idx + 1 >= words.length) {
      setSaving(true);
      try {
        const finalXp = calculateXP({
          type: 'learn',
          correct: correctCount,
          total: words.length,
        });
        await session.flush(finalXp);
        setDone(true);
      } finally {
        setSaving(false);
      }
      return;
    }

    setAnswer(null);
    setIdx((i) => i + 1);
  }, [answer, correctCount, idx, saving, session, words.length]);

  useEffect(() => {
    if (Platform.OS !== 'web' || loading || done || !current) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (answer && event.key === 'Enter') {
        event.preventDefault();
        void handleContinue();
        return;
      }

      if (!answer) {
        const optionIndex = Number(event.key) - 1;
        if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < options.length) {
          event.preventDefault();
          handleSelect(options[optionIndex]);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, current, done, handleContinue, handleSelect, loading, options]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
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

  if (done) {
    return <SessionDoneScreen xp={xp} total={words.length} correct={correctCount} />;
  }

  return (
    <Screen scroll={false}>
      <StudyHeader
        title={source === 'weak' ? mn.study.weakReviewTitle : 'Үг бататгах'}
        index={idx}
        total={words.length}
        trailing={Platform.OS === 'web' ? <RomajiToggleWeb /> : undefined}
      />

      {Platform.OS === 'web' ? (
        <Text style={styles.keyHint}>
          {answer ? 'Enter = үргэлжлүүлэх' : '1–4 = хариулт сонгох'}
        </Text>
      ) : null}

      <View style={styles.body}>
        <QuestionCard word={current!} promptType={promptType} />

        <View style={styles.options}>
          {options.map((option, optionIndex) => {
            let state: 'idle' | 'correct' | 'wrong' | 'reveal' = 'idle';
            if (answer) {
              if (option.id === current!.id) state = 'correct';
              else if (option.id === answer.chosenId) state = 'wrong';
            }

            return (
              <View key={option.id} style={styles.optionWrap}>
                {Platform.OS === 'web' ? (
                  <View style={styles.keyBadge}>
                    <Text style={styles.keyBadgeText}>{optionIndex + 1}</Text>
                  </View>
                ) : null}
                <View style={styles.optionBody}>
                  <AnswerOption
                    word={option}
                    show={promptType === 'jp-to-mn' ? 'mn' : 'jp'}
                    state={state}
                    onPress={() => handleSelect(option)}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {answer ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.feedback,
            {
              backgroundColor: tint(answer.correct ? colors.success : colors.error, 0.1),
              borderTopColor: answer.correct ? colors.success : colors.error,
            },
          ]}
        >
          <View style={styles.feedbackCopy}>
            <Text
              style={[
                styles.feedbackTitle,
                { color: answer.correct ? colors.success : colors.error },
              ]}
            >
              {answer.correct ? 'Зөв байна!' : 'Дахиад нэг сайн харъя'}
            </Text>
            <Text style={styles.feedbackText}>
              {answer.correct
                ? `${current!.kanji || current!.kana} · ${current!.meaning_mn}`
                : `Зөв хариулт: ${current!.kanji || current!.kana} · ${current!.meaning_mn}`}
            </Text>
          </View>
          <Button
            label={idx + 1 >= words.length ? 'ДУУСГАХ' : 'ҮРГЭЛЖЛҮҮЛЭХ'}
            size="md"
            fullWidth={false}
            loading={saving}
            onPress={() => void handleContinue()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyHint: {
    ...typography.body.xs,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    paddingTop: spacing.md,
  },
  options: { gap: spacing.xs },
  optionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionBody: { flex: 1 },
  keyBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  keyBadgeText: {
    ...typography.body.sm,
    color: colors.text.muted,
    fontWeight: '800',
  },
  feedback: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  feedbackCopy: { flex: 1 },
  feedbackTitle: {
    ...typography.heading.md,
  },
  feedbackText: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default LearnScreen;

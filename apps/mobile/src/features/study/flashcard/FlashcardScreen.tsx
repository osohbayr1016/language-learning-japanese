import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import type { ReviewRating } from '@japanese-learning/srs';
import { Button, Screen } from '../../../primitives';
import { useDueWords } from '../../../hooks/useDueWords';
import { useSrsRating } from '../../../hooks/useSrsRating';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { calculateXP } from '@japanese-learning/srs';
import { colors, spacing, typography } from '../../../theme';
import { StudyHeader } from '../StudyHeader';
import { StudyEmptyState } from '../EmptyState';
import { SessionDoneScreen } from '../SessionDoneScreen';
import { RatingBar } from '../../../components/srs/RatingBar';
import { mn } from '../../../i18n/mn';
import { FlipCard } from './FlipCard';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { useFlashcardWebKeys } from '../../../hooks/useFlashcardWebKeys';
import { RomajiToggleWeb } from '../RomajiToggleWeb';

import type { WordWithProgress } from '../../../lib/types';

function confidenceForRating(rating: ReviewRating): 0 | 1 | 2 {
  if (rating <= 1) return 0;
  if (rating === 3) return 1;
  return 2;
}

export default function FlashcardScreen({
  onSessionDone,
  initialWords,
}: {
  onSessionDone?: (xp: number, correct: number, total: number, words: WordWithProgress[]) => void;
  initialWords?: WordWithProgress[];
} = {}) {
  const { words: dueWords, loading, error } = useDueWords(15);
  const words = initialWords || dueWords;
  const session = useSrsRating('flashcard');
  const timer = useAdaptiveTimer();

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const handleRateRef = useRef<(rating: ReviewRating) => Promise<void>>(async () => {});
  const current = words[idx];

  useEffect(() => {
    if (current && !flipped) timer.start();
  }, [current, flipped, timer]);

  const xp = useMemo(
    () =>
      calculateXP({
        type: 'flashcard',
        correct: correctCount,
        total: words.length,
      }),
    [correctCount, words.length],
  );

  handleRateRef.current = async (rating: ReviewRating) => {
    if (!current) return;
    const responseMs = timer.stopAndReset();

    session.record(
      current.id,
      {
        ease_factor: current.ease_factor || 2.5,
        interval: current.interval || 0,
        repetitions: current.repetitions || 0,
      },
      {
        rating,
        responseMs,
        confidence: confidenceForRating(rating),
      },
    );

    if (rating >= 3) setCorrectCount((n) => n + 1);
    setFlipped(false);

    if (idx + 1 >= words.length) {
      await session.flush(xp + (rating >= 3 ? 5 : 0));
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const toggleFlip = useCallback(() => {
    setFlipped((value) => !value);
  }, []);

  const keysDisabled = loading || words.length === 0 || done || !current;

  useFlashcardWebKeys({
    flipped,
    disabled: keysDisabled,
    onFlip: toggleFlip,
    onRate: (rating) => void handleRateRef.current(rating),
  });

  if (loading && !initialWords) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </Screen>
    );
  }

  if (words.length === 0) {
    return <StudyEmptyState message={error ? mn.study.wordsLoadError : undefined} />;
  }

  if (done) {
    if (onSessionDone) {
      setTimeout(() => onSessionDone(xp, correctCount, words.length, words), 0);
      return null;
    }
    return <SessionDoneScreen xp={xp} total={words.length} correct={correctCount} />;
  }

  return (
    <Screen scroll={false}>
      <StudyHeader
        title="Давталт"
        index={idx}
        total={words.length}
        trailing={Platform.OS === 'web' ? <RomajiToggleWeb /> : undefined}
      />

      {Platform.OS === 'web' ? (
        <Text style={styles.keysHint}>
          {flipped ? '1 / 3 / 4 / 5 = үнэлэх' : 'Space = хариулт харах'}
        </Text>
      ) : null}

      <View style={styles.cardArea}>
        <FlipCard
          flipped={flipped}
          onPress={() => setFlipped((value) => !value)}
          front={<CardFront word={current} />}
          back={<CardBack word={current} />}
        />
      </View>

      <View style={styles.bottom}>
        {!flipped ? (
          <>
            <Text style={styles.prompt}>Утгыг санаж байна уу?</Text>
            <Button
              label="ХАРИУЛТ ХАРАХ"
              size="lg"
              onPress={() => setFlipped(true)}
            />
          </>
        ) : (
          <>
            <Text style={styles.prompt}>Хэр сайн санав?</Text>
            <RatingBar onRate={(rating) => void handleRateRef.current(rating)} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keysHint: {
    ...typography.body.xs,
    color: colors.text.muted,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  cardArea: {
    flex: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  bottom: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  prompt: {
    ...typography.heading.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import type { ReviewRating } from "@japanese-learning/srs";
import { Screen } from "../../../primitives";
import { useDueWords } from "../../../hooks/useDueWords";
import { useSrsRating } from "../../../hooks/useSrsRating";
import { useAdaptiveTimer } from "../../../hooks/useAdaptiveTimer";
import { calculateXP } from "@japanese-learning/srs";
import { colors, spacing, typography } from "../../../theme";
import { StudyHeader } from "../StudyHeader";
import { StudyEmptyState } from "../EmptyState";
import { SessionDoneScreen } from "../SessionDoneScreen";
import { RatingBar } from "../../../components/srs/RatingBar";
import { ConfidenceBar } from "../../../components/srs/ConfidenceBar";
import { mn } from "../../../i18n/mn";
import { FlipCard } from "./FlipCard";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import type { ConfidenceLevel } from "../../../lib/srs/adaptive";
import { useFlashcardWebKeys } from "../../../hooks/useFlashcardWebKeys";
import { PinyinToggleWeb } from "../PinyinToggleWeb";

import type { Word } from "@japanese-learning/db";

export default function FlashcardScreen({ onSessionDone, initialWords }: { onSessionDone?: (xp: number, correct: number, total: number, words: Word[]) => void, initialWords?: Word[] } = {}) {
  const { words: dueWords, loading, error } = useDueWords(15);
  const words = initialWords || dueWords;
  const session = useSrsRating("flashcard");
  const timer = useAdaptiveTimer();

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const handleRateRef = useRef<(rating: ReviewRating) => Promise<void>>(async () => {});

  const current = words[idx];

  useEffect(() => {
    if (current) timer.start();
  }, [current, timer]);

  const xp = useMemo(
    () =>
      calculateXP({
        type: "flashcard",
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
      { rating, responseMs, confidence: confidence ?? undefined },
    );
    if (rating >= 3) setCorrectCount((n) => n + 1);
    setConfidence(null);
    setFlipped(false);
    if (idx + 1 >= words.length) {
      await session.flush(xp + (rating >= 3 ? 5 : 0));
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const toggleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const keysDisabled =
    loading || words.length === 0 || done || !current;

  useFlashcardWebKeys({
    flipped,
    disabled: keysDisabled,
    onFlip: toggleFlip,
    onRate: (r) => void handleRateRef.current(r),
  });

  const handleRate = async (rating: ReviewRating) => {
    await handleRateRef.current(rating);
  };

  if (loading && !initialWords) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.purple} />
        </View>
      </Screen>
    );
  }

  if (words.length === 0) {
    return (
      <StudyEmptyState message={error ? mn.study.wordsLoadError : undefined} />
    );
  }

  if (done) {
    if (onSessionDone) {
      // Small timeout to allow state to settle before navigating
      setTimeout(() => onSessionDone(xp, correctCount, words.length, words), 0);
      return null;
    }
    return (
      <SessionDoneScreen xp={xp} total={words.length} correct={correctCount} />
    );
  }

  return (
    <Screen scroll={false}>
      <StudyHeader
        title={mn.study.flashcard}
        index={idx}
        total={words.length}
        trailing={<PinyinToggleWeb />}
      />
      {Platform.OS === "web" ? (
        <Text style={styles.keysHint}>{mn.study.webKeysFlashcard}</Text>
      ) : null}
      <View style={styles.cardArea}>
        <FlipCard
          flipped={flipped}
          onPress={() => setFlipped((f) => !f)}
          front={<CardFront word={current} />}
          back={<CardBack word={current} />}
        />
        {!flipped ? <Text style={styles.flipHint}>{mn.study.flipHint}</Text> : null}
      </View>
      {flipped ? (
        <View style={styles.bottom}>
          <ConfidenceBar value={confidence} onChange={setConfidence} />
          <View style={{ height: spacing.md }} />
          <RatingBar onRate={handleRate} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardArea: { flex: 1, paddingVertical: spacing.lg, justifyContent: "flex-start" },
  bottom: { paddingBottom: spacing.lg, gap: spacing.sm },
  flipHint: {
    ...typography.body.md,
    color: colors.text.muted,
    textAlign: "center",
    paddingTop: spacing.md,
  },
  keysHint: {
    ...typography.body.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
});

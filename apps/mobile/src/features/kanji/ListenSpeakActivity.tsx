import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../primitives';
import { PronounceButton } from '../../components/audio/PronounceButton';
import { SpeakMicPanel } from '../../components/practice/SpeakMicPanel';
import { SpeakSuccessCelebration } from '../../components/practice/SpeakSuccessCelebration';
import { useJapaneseSpeechRound } from '../../components/practice/useJapaneseSpeechRound';
import { SayFallback } from '../lessons/exercises/SayFallback';
import { getSpeechDisplay } from '../../lib/audio/speechCardTargets';
import type { Word } from '../../lib/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = { word: Word; onComplete: () => void };

export function ListenSpeakActivity({ word, onComplete }: Props) {
  const [phase, setPhase] = useState<'listen' | 'speak'>('listen');

  return (
    <View style={styles.wrap}>
      {phase === 'listen' ? (
        <>
          <Text style={styles.instruction}>Доорх товчийг дарж дуудлагыг сонсоорой:</Text>
          <PronounceButton wordId={word.id} meaningMn={word.meaning_mn} size="lg" />
          <Button
            label="Шалгах"
            leftIcon={<Ionicons name="mic" size={22} color={colors.text.inverse} />}
            onPress={() => setPhase('speak')}
            accessibilityLabel="Шалгах — дуут шалгалтанд орно"
            style={styles.btn}
          />
        </>
      ) : (
        <ListenSpeakSpeakPhase word={word} onPass={onComplete} onListenAgain={() => setPhase('listen')} />
      )}
    </View>
  );
}

function ListenSpeakSpeakPhase({
  word,
  onPass,
  onListenAgain,
}: {
  word: Word;
  onPass: () => void;
  onListenAgain: () => void;
}) {
  const target = getSpeechDisplay(word, 'word');
  const passAndComplete = useCallback(
    (ok: boolean) => {
      if (ok) onPass();
    },
    [onPass]
  );

  const speech = useJapaneseSpeechRound({
    word,
    target,
    speechPrompt: 'word',
    hideMongolian: false,
    disabled: false,
    onEvaluated: passAndComplete,
  });

  return (
    <>
      <Text style={styles.instruction}>Одоо та дараах байдлаар хэлж үзээрэй:</Text>
      <View style={styles.pinyinBox}>
        <Text style={styles.hanziLarge}>{word.kanji}</Text>
        <Text style={styles.pinyinLarge}>{word.romaji}</Text>
      </View>
      <Text style={styles.meaning}>{word.meaning_mn}</Text>

      <View style={styles.relative}>
        {speech.supported ? (
          <SpeakMicPanel
            disabled={false}
            submitted={speech.submitted}
            processing={speech.processing}
            activeMic={speech.activeMic}
            onMicPress={() => void speech.onMicPress()}
            liveTranscript={speech.liveTranscript}
            outcome={speech.outcome}
            errorMessage={speech.errorMessage}
          />
        ) : (
          <SayFallback
            disabled={speech.submitted}
            onSpoken={() => speech.markFallbackAnswer(true)}
            onSkip={() => speech.markFallbackAnswer(false)}
          />
        )}
        <SpeakSuccessCelebration stamp={speech.celebrateStamp} />
      </View>

      <Pressable onPress={onListenAgain} style={styles.back} accessibilityRole="button">
        <Text style={styles.backText}>← Дахин сонсох</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  relative: { position: 'relative', width: '100%', minHeight: 120 },
  instruction: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pinyinBox: {
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hanziLarge: { fontSize: 56, fontWeight: '800', color: colors.text.primary },
  pinyinLarge: { ...typography.heading.lg, color: colors.brand.secondary, marginTop: 4 },
  meaning: { ...typography.body.md, color: colors.text.muted },
  btn: { width: '100%' },
  back: { padding: spacing.sm },
  backText: { ...typography.body.sm, color: colors.text.muted },
});

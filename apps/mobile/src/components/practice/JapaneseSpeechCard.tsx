import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Word } from '../../lib/types';
import { getSpeechDisplay, type SpeechPromptScope } from '../../lib/audio/speechCardTargets';
import { SayFallback } from '../../features/lessons/exercises/SayFallback';
import { speakMicListeningHintEn } from './japaneseSpeechLabels';
import { SpeakMicPanel } from './SpeakMicPanel';
import { SpeakSuccessCelebration } from './SpeakSuccessCelebration';
import { SpeakWordCardFace } from './SpeakWordCardFace';
import { useJapaneseSpeechRound } from './useJapaneseSpeechRound';

type Props = {
  word: Word;
  disabled?: boolean;
  speechPrompt?: SpeechPromptScope;
  onEvaluated: (p: boolean) => void;
  onScore?: (n: number) => void;
  /** Speak hub: hide MN gloss, MN button, and use English hints/outcomes. */
  hideMongolian?: boolean;
};

export function JapaneseSpeechCard({
  word,
  disabled,
  speechPrompt = 'word',
  onEvaluated,
  onScore,
  hideMongolian = false,
}: Props) {
  const target = getSpeechDisplay(word, speechPrompt);
  const s = useJapaneseSpeechRound({
    word,
    target,
    speechPrompt,
    hideMongolian,
    disabled,
    onEvaluated,
    onScore,
  });

  return (
    <View style={styles.root}>
      <SpeakWordCardFace
        word={word}
        japanese={target.jp}
        reading={target.romaji}
        showMongolianMeaning={!hideMongolian}
        exampleAside={s.exampleAside}
      />

      {s.supported ? (
        <SpeakMicPanel
          disabled={!!disabled}
          submitted={s.submitted}
          processing={s.processing}
          activeMic={s.activeMic}
          onMicPress={() => void s.onMicPress()}
          liveTranscript={s.liveTranscript}
          outcome={s.outcome}
          errorMessage={s.errorMessage}
          listeningHint={hideMongolian ? speakMicListeningHintEn() : undefined}
          liveTranscriptLabel={hideMongolian ? 'Live:' : undefined}
        />
      ) : (
        <SayFallback
          english={hideMongolian}
          disabled={disabled || s.submitted}
          onSpoken={() => s.markFallbackAnswer(true)}
          onSkip={() => s.markFallbackAnswer(false)}
        />
      )}
      <SpeakSuccessCelebration stamp={s.celebrateStamp} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', position: 'relative' },
});
